import type { Collection, Document } from 'mongodb';

import { ensureCollection, ensureIndexes } from '../helper.ts';
import { getClient } from '../client.ts';
import { env } from '../../../env.ts';

interface AuthChallenge extends Document {
  _id: string
  challenge: string
  createdAt: Date
  expiresAt: Date
  type: 'authentication' | 'registration'
}

const collectionName = 'auth_challenges';

const collectionSchema = {
  title: 'AuthChallenge',
  bsonType: 'object',
  required: ['_id', 'challenge', 'createdAt', 'expiresAt', 'type'],
  properties: {
    _id: { bsonType: 'string' },
    challenge: { bsonType: 'string' },
    type: { enum: ['authentication', 'registration'] },
    createdAt: { bsonType: 'date' },
    expiresAt: { bsonType: 'date' },
  },
  additionalProperties: false,
} as Document;

async function setup(): Promise<Collection<AuthChallenge>> {
  const { db } = await getClient(env.MONGODB_ADMIN_CERT_PATH);
  const collection = await ensureCollection<AuthChallenge>(db, collectionName, {
    validator: { $jsonSchema: collectionSchema },
    validationLevel: 'strict',
    validationAction: 'error',
  });
  await ensureIndexes(collection, [
    { key: { expiresAt: 1 }, name: 'expires-at-ttl', expireAfterSeconds: 0 },
  ]);
  return collection;
}

export { setup };
