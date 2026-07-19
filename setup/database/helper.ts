import type {
  AutoEncryptionOptions,
  AWSEncryptionKeyOptions,
  AzureEncryptionKeyOptions,
  Collection,
  CreateCollectionOptions,
  Db,
  Document,
  GCPEncryptionKeyOptions,
  IndexDescription,
  KMIPEncryptionKeyOptions,
  KMSProviders,
} from 'mongodb';

export type KMSProviderName = 'aws' | 'azure' | 'gcp' | 'kmip' | 'local';

type CollectionValidationOptions = Pick<
  CreateCollectionOptions,
  'validationAction' | 'validationLevel' | 'validator'
>;

export async function ensureCollection<TSchema extends Document>(
  db: Db,
  collectionName: string,
  options: CollectionValidationOptions,
): Promise<Collection<TSchema>> {
  const exists = await db.listCollections({ name: collectionName }, { nameOnly: true }).hasNext();

  if (!exists) {
    try {
      const collection = await db.createCollection<TSchema>(collectionName, options);
      console.log(`Collection "${collectionName}" successfully created!`);
      return collection;
    } catch (error) {
      if (!isNamespaceExistsError(error)) throw error;
    }
  }

  await db.command({ collMod: collectionName, ...options });
  console.log(`Schema da colecao '${collectionName}' atualizado!`);
  return db.collection<TSchema>(collectionName);
}

export async function ensureIndexes<TSchema extends Document>(
  collection: Collection<TSchema>,
  indexes: IndexDescription[],
): Promise<void> {
  const existingIndexes = await collection.indexes();

  for (const index of indexes) {
    if (!index.name) throw new Error('Managed indexes must have a name');

    const existingByName = existingIndexes.find((existing) => existing.name === index.name);

    if (existingByName && isSameIndex(existingByName, index)) continue;

    if (existingByName) {
      await collection.dropIndex(index.name);
    } else if (existingIndexes.some((existing) => isSameIndex(existing, index))) {
      continue;
    }

    const { key, ...options } = index;
    await collection.createIndex(key, options);
  }
}

function isNamespaceExistsError(error: unknown): boolean {
  return (
    typeof error === 'object'
    && error !== null
    && (('codeName' in error && error.codeName === 'NamespaceExists')
      || ('code' in error && error.code === 48))
  );
}

function isSameIndex(existing: IndexDescription, expected: IndexDescription): boolean {
  const getComparableOptions = (index: IndexDescription) => ({
    key: index.key,
    unique: index.unique,
    sparse: index.sparse,
    partialFilterExpression: index.partialFilterExpression,
    expireAfterSeconds: index.expireAfterSeconds,
    collation: index.collation,
  });

  const existingOptions = JSON.stringify(getComparableOptions(existing));
  const expectedOptions = JSON.stringify(getComparableOptions(expected));
  return existingOptions === expectedOptions;
}

function getKmipTlsOptions() {
  const tlsOptions = {
    kmip: {
      tlsCAFile: process.env.KMIP_TLS_CA_FILE, // Path to your TLS CA file
      tlsCertificateKeyFile: process.env.KMIP_TLS_CERT_FILE, // Path to your TLS certificate key file
    },
  };

  return tlsOptions;
}

export function getKMSProviderCredentials(kmsProviderName: KMSProviderName): KMSProviders {
  let kmsProviders;

  switch (kmsProviderName) {
    case 'aws':
      kmsProviders = {
        aws: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      };
      return kmsProviders as KMSProviders;

    case 'azure':
      kmsProviders = {
        azure: {
          tenantId: process.env.AZURE_TENANT_ID,
          clientId: process.env.AZURE_CLIENT_ID,
          clientSecret: process.env.AZURE_CLIENT_SECRET,
        },
      };
      return kmsProviders as KMSProviders;

    case 'gcp':
      kmsProviders = {
        gcp: {
          email: process.env.GCP_EMAIL,
          privateKey: process.env.GCP_PRIVATE_KEY,
        },
      };
      return kmsProviders as KMSProviders;

    case 'kmip':
      kmsProviders = {
        kmip: {
          endpoint: process.env.KMIP_KMS_ENDPOINT,
        },
      };
      return kmsProviders as KMSProviders;

    default:
      throw new Error(
        `Unrecognized value for KMS provider name "${kmsProviderName}"
         encountered while retrieving KMS credentials.`,
      );
  }
}

export function getCustomerMasterKeyCredentials(
  kmsProviderName: KMSProviderName,
):
  | AWSEncryptionKeyOptions
  | AzureEncryptionKeyOptions
  | GCPEncryptionKeyOptions
  | KMIPEncryptionKeyOptions {
  let customerMasterKeyCredentials;

  switch (kmsProviderName) {
    case 'aws':
      customerMasterKeyCredentials = {
        key: process.env.AWS_KEY_ARN,
        region: process.env.AWS_KEY_REGION,
      };
      return customerMasterKeyCredentials as AWSEncryptionKeyOptions;
    case 'azure':
      customerMasterKeyCredentials = {
        keyVaultEndpoint: process.env.AZURE_KEY_VAULT_ENDPOINT,
        keyName: process.env.AZURE_KEY_NAME,
      };
      return customerMasterKeyCredentials as AzureEncryptionKeyOptions;
    case 'gcp':
      customerMasterKeyCredentials = {
        projectId: process.env.MONGODB_GCP_PROJECT_ID,
        location: process.env.MONGODB_CMK_LOCATION,
        keyRing: process.env.MONGODB_CMK_KEY_RING,
        keyName: process.env.MONGODB_CMK_KEY_NAME,
      };
      return customerMasterKeyCredentials as GCPEncryptionKeyOptions;
    case 'kmip':
      customerMasterKeyCredentials = {};
      return customerMasterKeyCredentials as KMIPEncryptionKeyOptions;
    default:
      throw new Error(
        `Unrecognized value for KMS provider name "${kmsProviderName}"
         encountered while retrieving Customer Master Key credentials.`,
      );
  }
}

export function getAutoEncryptionOptions(
  kmsProviderName: KMSProviderName,
  keyVaultNamespace: string,
  kmsProviders: KMSProviders,
): AutoEncryptionOptions {
  const autoEncryptionOptions = {
    keyVaultNamespace,
    kmsProviders,
    extraOptions: {
      cryptSharedLibPath: process.env.SHARED_LIB_PATH,
    },
  } as AutoEncryptionOptions;

  if (kmsProviderName === 'kmip') {
    autoEncryptionOptions.tlsOptions = getKmipTlsOptions();
  }

  return autoEncryptionOptions;
}
