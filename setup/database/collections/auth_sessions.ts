import type { AuthSession } from '#shared/schemas/authSessions.ts';
import type { Collection, Document } from 'mongodb';

import { ensureCollection, ensureIndexes } from '../helper.ts';
import { getClient } from '../client.ts';
import { env } from '../../../env.ts';

const collectionName = 'auth_sessions';

const collectionSchema = {
  title: 'AuthSession',
  bsonType: 'object',
  required: [
    '_id', 'browser', 'createdAt', 'credentialId', 'endedAt', 'expiresAt',
    'lastSeenAt', 'os', 'platform', 'sessionId', 'updatedAt', 'userId',
  ],
  properties: {
    _id: { bsonType: 'objectId' },
    userId: { bsonType: 'objectId' },
    sessionId: { bsonType: 'string' },
    credentialId: { bsonType: 'string' },
    browser: { bsonType: ['string', 'null'] },
    os: { bsonType: ['string', 'null'] },
    platform: { bsonType: ['string', 'null'] },
    lastSeenAt: { bsonType: ['date', 'null'] },
    expiresAt: { bsonType: 'date' },
    endedAt: { bsonType: ['date', 'null'] },
    createdAt: { bsonType: 'date' },
    updatedAt: { bsonType: ['date', 'null'] },
  },
  additionalProperties: false,
} as Document;

async function setup(): Promise<Collection<AuthSession>> {
  const { db } = await getClient(env.MONGODB_ADMIN_CERT_PATH);
  const collection = await ensureCollection<AuthSession>(db, collectionName, {
    validator: { $jsonSchema: collectionSchema },
    validationLevel: 'strict',
    validationAction: 'error',
  });

  await ensureIndexes(collection, [
    { key: { sessionId: 1 }, name: 'session-id', unique: true },
    { key: { userId: 1, createdAt: -1 }, name: 'user-created-at' },
    { key: { expiresAt: 1 }, name: 'expires-at-ttl', expireAfterSeconds: 0 },
  ]);
  return collection;
}

export { setup };
