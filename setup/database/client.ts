import { ClientEncryption, MongoClient } from 'mongodb';

import type {
  AWSEncryptionKeyOptions,
  AzureEncryptionKeyOptions,
  ClientEncryptionOptions,
  Collection,
  CreateCollectionOptions,
  Db,
  Document,
  GCPEncryptionKeyOptions,
  UUID,
} from 'mongodb';
import type { KMSProviderName } from './helper.ts';

import {
  getAutoEncryptionOptions,
  getCustomerMasterKeyCredentials,
  getKMSProviderCredentials,
} from './helper.ts';
import { env } from '../../env.ts';

const databaseClients = new Set<MongoClient>();
let shutdownHandlersRegistered = false;

export type CreateEncryptedCollectionFunction = <TSchema extends Document = Document>(
  encryptedCollectionName: string,
  encryptedFieldsMap: EncryptedCollectionOptions,
) => Promise<{ collection: Collection<TSchema>, encryptedFields: Document }>;

type EncryptedCollectionOptions = Omit<CreateCollectionOptions, 'encryptedFields'> & {
  encryptedFields: Document
};

type QueryableEncryptionMasterKey
  = | AWSEncryptionKeyOptions
    | AzureEncryptionKeyOptions
    | GCPEncryptionKeyOptions;

async function getClient(userCertFile?: string): Promise<{
  client: MongoClient
  db: Db
}> {
  const uri = env.MONGODB_URI;
  if (!uri) throw new Error('Sem URL do MongoDB');

  const normalClient = new MongoClient(uri, {
    tlsCertificateKeyFile: userCertFile || env.MONGODB_CERT_PATH,
  });

  await normalClient.connect();
  databaseClients.add(normalClient);
  registerShutdownHandlers();

  const db = normalClient.db(env.MONGODB_DATA_DB);

  return { client: normalClient, db };
}

async function getSecureClient(userCertFile?: string): Promise<{
  client: MongoClient
  clientEncryption: ClientEncryption
  createEncryptedCollection: CreateEncryptedCollectionFunction
  db: Db

  createDek: (keyAltNames?: string[]) => Promise<UUID>
}> {
  const uri = env.MONGODB_URI;
  const kmsProviderName = (env.MONGODB_KMS_PROVIDER_NAME || 'gcp') as KMSProviderName;
  const keyVaultNamespace
    = `${env.MONGODB_KEY_VAULT_DB_NAME}.${env.MONGODB_KEY_VAULT_COLLECTION_NAME}`;

  if (!uri) throw new Error('Sem URL do MongoDB');

  const kmsProviderCredentials = getKMSProviderCredentials(kmsProviderName);
  const customerMasterKeyCredentials = getCustomerMasterKeyCredentials(kmsProviderName);

  const autoEncryptionOptions = getAutoEncryptionOptions(
    kmsProviderName,
    keyVaultNamespace,
    kmsProviderCredentials,
  );

  const encryptedClient = new MongoClient(uri, {
    tlsCertificateKeyFile: userCertFile || env.MONGODB_CERT_PATH,
    autoEncryption: autoEncryptionOptions,
  });

  const clientEncryption = new ClientEncryption(
    encryptedClient,
    autoEncryptionOptions as ClientEncryptionOptions,
  );

  await encryptedClient.connect();
  databaseClients.add(encryptedClient);
  registerShutdownHandlers();

  const db = encryptedClient.db(env.MONGODB_DATA_DB);

  async function createEncryptedCollection<TSchema extends Document = Document>(
    encryptedCollectionName: string,
    createCollectionOptions: EncryptedCollectionOptions,
  ): Promise<{ collection: Collection<TSchema>, encryptedFields: Document }> {
    const getExistingEncryptedCollection = async () => {
      const collectionInfo = await db
        .listCollections({ name: encryptedCollectionName }, { nameOnly: false })
        .next();

      if (!collectionInfo) return null;

      const encryptedFields = collectionInfo.options?.encryptedFields;
      if (!encryptedFields) {
        throw new Error(
          `Collection "${encryptedCollectionName}" already exists without encryptedFields`,
        );
      }

      return {
        collection: db.collection<TSchema>(encryptedCollectionName),
        encryptedFields,
      };
    };

    const existingCollection = await getExistingEncryptedCollection();
    if (existingCollection) return existingCollection;

    try {
      return await clientEncryption.createEncryptedCollection<TSchema>(
        db,
        encryptedCollectionName,
        {
          provider: kmsProviderName,
          createCollectionOptions,
          masterKey: customerMasterKeyCredentials as QueryableEncryptionMasterKey,
        },
      );
    } catch (err) {
      const collectionCreatedConcurrently = await getExistingEncryptedCollection();
      if (collectionCreatedConcurrently) return collectionCreatedConcurrently;

      throw new Error(`Unable to create encrypted collection due to the following error: ${err}`, {
        cause: err,
      });
    }
  }

  async function createDek(keyAltNames?: string[]): Promise<UUID> {
    try {
      return await clientEncryption.createDataKey(kmsProviderName, {
        masterKey: customerMasterKeyCredentials,
        keyAltNames,
      });
    } catch (err) {
      throw new Error(`Unable to create DEK due to the following error: ${err}`, { cause: err });
    }
  }

  return {
    client: encryptedClient,
    clientEncryption,
    db,
    createEncryptedCollection,
    createDek,
  };
}

async function closeDatabaseClients(): Promise<void> {
  await Promise.all([...databaseClients].map((client) => client.close()));
  databaseClients.clear();
}

function registerShutdownHandlers(): void {
  if (shutdownHandlersRegistered) return;
  shutdownHandlersRegistered = true;

  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, async () => {
      console.log(`\nReceived ${signal}. Closing MongoDB...`);
      try {
        await closeDatabaseClients();
        console.log('MongoDB disconnected cleanly');
      } catch (error) {
        console.error('Error closing MongoDB:', error);
        process.exitCode = 1;
      }
    });
  }

  process.once('beforeExit', closeDatabaseClients);
}

export { closeDatabaseClients, getClient, getSecureClient };
