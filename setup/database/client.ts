import { ClientEncryption, MongoClient } from 'mongodb';

import type {
  ClientEncryptionOptions,
  Collection,
  CreateCollectionOptions,
  Db,
  Document,
  UUID,
} from 'mongodb';
import type { KMSProviderName } from './helper.ts';

import {
  getAutoEncryptionOptions,
  getCustomerMasterKeyCredentials,
  getKMSProviderCredentials,
} from './helper.ts';
import { env } from '../../env.ts';

export type CreateEncryptedCollectionFunction = <TSchema extends Document = Document>(
  encryptedCollectionName: string,
  encryptedFieldsMap: CreateCollectionOptions,
) => Promise<{ collection: Collection<TSchema>; encryptedFields: Document }>;

async function getClient(userCertFile?: string): Promise<{
  client: MongoClient;
  db: Db;
}> {
  const uri = env.MONGODB_URI;
  if (!uri) throw new Error('Sem URL do MongoDB');

  const normalClient = new MongoClient(uri, {
    tlsCertificateKeyFile: userCertFile || env.MONGODB_CERT_PATH,
  });

  await normalClient.connect();

  const db = normalClient.db(env.MONGODB_DATA_DB);

  async function gracefulShutdown(signal: string) {
    console.log(`\nReceived ${signal}. Closing MongoDB...`);
    try {
      await normalClient.close();
      console.log('MongoDB disconnected cleanly');
    } catch (err) {
      console.error('Error closing MongoDB:', err);
    } finally {
      process.exit(0);
    }
  }

  // Eventos padrão de desligamento no Node.js
  ['SIGINT', 'SIGTERM'].forEach((signal) => {
    process.on(signal, () => gracefulShutdown(signal));
  });

  // Garantir fechamento antes de sair naturalmente
  process.on('beforeExit', async () => {
    if (normalClient) await normalClient.close();
  });

  return { client: normalClient, db };
}

async function getSecureClient(userCertFile?: string): Promise<{
  client: MongoClient;
  clientEncryption: ClientEncryption;
  createEncryptedCollection: CreateEncryptedCollectionFunction;
  db: Db;

  createDek: (keyAltNames?: string[]) => Promise<UUID>;
}> {
  const uri = env.MONGODB_URI;
  const kmsProviderName = (env.MONGODB_KMS_PROVIDER_NAME || 'gcp') as KMSProviderName;
  const keyVaultNamespace = `${env.MONGODB_KEY_VAULT_DB_NAME}.${env.MONGODB_KEY_VAULT_COLLECTION_NAME}`;

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

  const db = encryptedClient.db(env.MONGODB_DATA_DB);

  async function createEncryptedCollection<TSchema extends Document = Document>(
    encryptedCollectionName: string,
    createCollectionOptions: CreateCollectionOptions,
  ): Promise<{ collection: Collection<TSchema>; encryptedFields: Document }> {
    try {
      return await clientEncryption.createEncryptedCollection<TSchema>(
        db,
        encryptedCollectionName,
        {
          provider: kmsProviderName,
          createCollectionOptions,
          masterKey: customerMasterKeyCredentials,
        },
      );
    } catch (err) {
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

  async function gracefulShutdown(signal: string) {
    console.log(`\nReceived ${signal}. Closing MongoDB...`);
    try {
      await encryptedClient.close();
      console.log('MongoDB disconnected cleanly');
    } catch (err) {
      console.error('Error closing MongoDB:', err);
    }
  }

  // Eventos padrão de desligamento no Node.js
  ['SIGINT', 'SIGTERM'].forEach((signal) => {
    process.on(signal, () => gracefulShutdown(signal));
  });

  // Garantir fechamento antes de sair naturalmente
  process.on('beforeExit', async () => {
    if (encryptedClient) await encryptedClient.close();
  });

  return {
    client: encryptedClient,
    clientEncryption,
    db,
    createEncryptedCollection,
    createDek,
  };
}

export { getClient, getSecureClient };
