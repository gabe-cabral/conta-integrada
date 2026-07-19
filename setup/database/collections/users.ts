import type { Collection, Document } from 'mongodb';
import type { User } from '#shared/types/user.ts';

import { getClient, getSecureClient } from '../client.ts';
import { ensureIndexes } from '../helper.ts';
import { env } from '../../../env.ts';

const collectionName = 'users';

const usersCollectionSchema = {
  title: 'User',
  bsonType: 'object',
  required: ['_id', 'createdAt', 'email'],
  properties: {
    _id: { bsonType: 'objectId' },
    // Queryable Encryption owns the BSON representation of these fields.
    email: {},
    name: {},
    __safeContent__: {
      bsonType: 'array',
      items: { bsonType: 'binData' },
      description: 'Queryable Encryption metadata managed by MongoDB',
    },
    active: { bsonType: 'bool' },
    initialPinHash: { bsonType: 'string' },
    lastAccessAt: { bsonType: ['date', 'null'] },
    createdAt: { bsonType: ['date', 'null'] },
    updatedAt: { bsonType: ['date', 'null'] },
  },
  additionalProperties: false,
} as Document;

async function setup(): Promise<Collection<User> | null> {
  const { createEncryptedCollection } = await getSecureClient();

  const encryption = await createEncryptedCollection<User>(collectionName, {
    validator: { $jsonSchema: usersCollectionSchema },
    validationLevel: 'strict',
    validationAction: 'error',
    encryptedFields: {
      fields: [
        {
          path: 'email',
          bsonType: 'string',
          queries: [{ queryType: 'equality' }],
        },
        {
          path: 'name',
          bsonType: 'string',
        },
      ],
    },
  });

  // createEncryptedCollection reuses existing encrypted collections, so keep
  // the non-encryption validator and indexes synchronized explicitly.
  const { db } = await getClient(env.MONGODB_ADMIN_CERT_PATH);
  await db.command({
    collMod: collectionName,
    validator: { $jsonSchema: usersCollectionSchema },
    validationLevel: 'strict',
    validationAction: 'error',
  });
  await ensureIndexes(encryption.collection, [
    { key: { active: 1, createdAt: -1 }, name: 'active-created-at' },
  ]);

  return encryption.collection;
}

export { setup };
