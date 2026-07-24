import type { UserCategory } from '#shared/schemas/categories.ts';
import type { Collection, Document } from 'mongodb';

import { CATEGORY_KINDS, CATEGORY_LEVELS } from '#shared/constants/categories.ts';

import { ensureCollection, ensureIndexes } from '../helper.ts';
import { getClient } from '../client.ts';
import { env } from '../../../env.ts';

const collectionName = 'user_categories';

const userCategoryCollectionSchema = {
  title: 'UserCategory',
  bsonType: 'object',
  required: [
    '_id',
    'active',
    'catalogCategoryId',
    'color',
    'createdAt',
    'kind',
    'level',
    'name',
    'nameNormalized',
    'parentId',
    'updatedAt',
    'userId',
  ],
  properties: {
    _id: { bsonType: 'objectId' },
    userId: { bsonType: 'objectId' },
    catalogCategoryId: { bsonType: ['objectId', 'null'] },
    parentId: { bsonType: ['objectId', 'null'] },
    name: { bsonType: ['binData', 'null'] },
    nameNormalized: { bsonType: ['binData', 'null'] },
    active: { bsonType: 'bool' },
    color: { bsonType: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
    kind: { enum: [...CATEGORY_KINDS] },
    level: { enum: [...CATEGORY_LEVELS] },
    createdAt: { bsonType: 'date' },
    updatedAt: { bsonType: ['date', 'null'] },
  },
  additionalProperties: false,
} as Document;

async function setup(): Promise<Collection<UserCategory>> {
  const { db } = await getClient(env.MONGODB_ADMIN_CERT_PATH);
  const collection = await ensureCollection<UserCategory>(db, collectionName, {
    validator: { $jsonSchema: userCategoryCollectionSchema },
    validationLevel: 'strict',
    validationAction: 'error',
  });

  await ensureIndexes(collection, [
    { key: { userId: 1, active: 1, kind: 1 }, name: 'user-active-kind' },
    { key: { userId: 1, parentId: 1 }, name: 'user-parent' },
    {
      key: { userId: 1, catalogCategoryId: 1 },
      name: 'user-catalog-category',
      unique: true,
      partialFilterExpression: { catalogCategoryId: { $type: 'objectId' } },
    },
    {
      key: { userId: 1, kind: 1, parentId: 1, nameNormalized: 1 },
      name: 'user-custom-name',
      unique: true,
      partialFilterExpression: { nameNormalized: { $type: 'binData' } },
    },
  ]);

  return collection;
}

export { setup };
