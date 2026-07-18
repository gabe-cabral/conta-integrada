import { MongoClient, ServerApiVersion } from 'mongodb';

import type { ClientEncryption, Db } from 'mongodb';

import { getSecureClient } from '../../setup/database/client';

let client: MongoClient;
let secureClient: MongoClient;
let clientEncryption: ClientEncryption;

export async function useDatabase() {
  const { mongoDb } = useRuntimeConfig();

  if (!mongoDb?.uri) throw new Error('Sem URL do MongoDB');

  if (!client) {
    try {
      client = new MongoClient(mongoDb.uri, {
        tlsCertificateKeyFile: mongoDb.certPath,
        serverApi: ServerApiVersion.v1,
        connectTimeoutMS: 10000,
        maxIdleTimeMS: 10000,
      });

      await client.connect();
      console.log('✅ Connected to MongoDB');
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error);
    }
  }

  return client.db(mongoDb.dbName);
}

export async function useSecureClient(): Promise<{
  client: MongoClient
  clientEncryption: ClientEncryption
  db: Db
}> {
  const { mongoDb } = useRuntimeConfig();

  if (!secureClient) {
    const secureConnection = await getSecureClient();
    secureClient = secureConnection.client;
    clientEncryption = secureConnection.clientEncryption;
  }

  return { client: secureClient, db: secureClient.db(mongoDb.dbName), clientEncryption };
}
