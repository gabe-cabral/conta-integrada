import type {
  AutoEncryptionOptions,
  AWSEncryptionKeyOptions,
  AzureEncryptionKeyOptions,
  ClientEncryption,
  Db,
  GCPEncryptionKeyOptions,
  KMIPEncryptionKeyOptions,
  KMSProviders,
} from 'mongodb';

export type KMSProviderName = 'aws' | 'azure' | 'gcp' | 'kmip' | 'local';
type CustomerMasterKeyCredentials =
  | AWSEncryptionKeyOptions
  | AzureEncryptionKeyOptions
  | GCPEncryptionKeyOptions
  | KMIPEncryptionKeyOptions;

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
        `Unrecognized value for KMS provider name "${kmsProviderName}" encountered while retrieving KMS credentials.`,
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
        `Unrecognized value for KMS provider name "${kmsProviderName}" encountered while retrieving Customer Master Key credentials.`,
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

export async function createEncryptedCollection(
  clientEncryption: ClientEncryption,
  encryptedDatabase: Db,
  encryptedCollectionName: string,
  kmsProviderName: KMSProviderName,
  encryptedFieldsMap: Document,
  customerMasterKeyCredentials: CustomerMasterKeyCredentials,
) {
  try {
    await clientEncryption.createEncryptedCollection(encryptedDatabase, encryptedCollectionName, {
      provider: kmsProviderName,
      createCollectionOptions: encryptedFieldsMap,
      masterKey: customerMasterKeyCredentials,
    });
  } catch (err) {
    throw new Error(`Unable to create encrypted collection due to the following error: ${err}`, {
      cause: err,
    });
  }
}
