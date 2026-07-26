import type { CostCenter } from '#shared/schemas/costCenters.ts';
import type { Collection, Document } from 'mongodb';

import { ensureCollection, ensureIndexes } from '../helper.ts';
import { getClient } from '../client.ts';
import { env } from '../../../env.ts';

const collectionName = 'cost_centers';

const costCentersCollectionSchema = {
  title: 'CostCenter',
  bsonType: 'object',
  required: [
    '_id',
    'active',
    'categoryIds',
    'createdAt',
    'name',
    'updatedAt',
    'userId',
  ],
  properties: {
    _id: { bsonType: 'objectId' },
    userId: { bsonType: 'objectId' },
    name: { bsonType: 'binData', description: 'Encrypted cost center name' },
    description: { bsonType: 'binData', description: 'Encrypted optional description' },
    limit: { bsonType: 'binData', description: 'Encrypted optional monthly spending limit' },
    categoryIds: {
      bsonType: 'array',
      uniqueItems: true,
      items: { bsonType: 'objectId' },
    },
    active: { bsonType: 'bool' },
    createdAt: { bsonType: 'date' },
    updatedAt: { bsonType: ['date', 'null'] },
  },
  additionalProperties: false,
} as Document;

async function setup(): Promise<Collection<CostCenter>> {
  const { db } = await getClient(env.MONGODB_ADMIN_CERT_PATH);
  const collection = await ensureCollection<CostCenter>(db, collectionName, {
    validator: { $jsonSchema: costCentersCollectionSchema },
    validationLevel: 'strict',
    validationAction: 'error',
  });

  await ensureIndexes(collection, [
    { key: { userId: 1, active: 1, createdAt: 1 }, name: 'user-active-created-at' },
    { key: { userId: 1, categoryIds: 1 }, name: 'user-categories' },
  ]);

  return collection;
}

export { setup };
