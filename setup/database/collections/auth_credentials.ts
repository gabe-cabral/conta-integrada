import type { AuthCredential } from '#shared/schemas/authCredentials.ts';
import type { Collection, Document } from 'mongodb';

import { ensureCollection, ensureIndexes } from '../helper.ts';
import { getClient } from '../client.ts';
import { env } from '../../../env.ts';

const collectionName = 'auth_credentials';

const collectionSchema = {
  title: 'AuthCredential',
  bsonType: 'object',
  required: [
    '_id', 'backedUp', 'counter', 'createdAt', 'id', 'publicKey', 'userId',
  ],
  properties: {
    _id: { bsonType: 'objectId' },
    userId: { bsonType: 'objectId' },
    id: { bsonType: 'string' },
    publicKey: { bsonType: 'string' },
    counter: { bsonType: ['int', 'long', 'double', 'decimal'] },
    backedUp: { bsonType: 'bool' },
    transports: {
      bsonType: ['array', 'null'],
      items: { bsonType: 'string' },
    },
    aaguid: { bsonType: ['string', 'null'] },
    browser: { bsonType: ['string', 'null'] },
    os: { bsonType: ['string', 'null'] },
    platform: { bsonType: ['string', 'null'] },
    lastUsedAt: { bsonType: ['date', 'null'] },
    createdAt: { bsonType: 'date' },
    updatedAt: { bsonType: ['date', 'null'] },
  },
  additionalProperties: false,
} as Document;

async function setup(): Promise<Collection<AuthCredential>> {
  const { db } = await getClient(env.MONGODB_ADMIN_CERT_PATH);
  const collection = await ensureCollection<AuthCredential>(db, collectionName, {
    validator: { $jsonSchema: collectionSchema },
    validationLevel: 'strict',
    validationAction: 'error',
  });

  await ensureIndexes(collection, [
    { key: { id: 1 }, name: 'credential-id', unique: true },
    { key: { userId: 1, createdAt: -1 }, name: 'user-created-at' },
  ]);
  return collection;
}

export { setup };
