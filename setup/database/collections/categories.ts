import type { Category } from '#shared/schemas/categories.ts';
import type { Collection, Document } from 'mongodb';

import { CATEGORY_KINDS, CATEGORY_LEVELS } from '#shared/constants/categories.ts';

import { ensureCollection, ensureIndexes } from '../helper.ts';
import { getClient } from '../client.ts';
import { env } from '../../../env.ts';

const collectionName = 'categories';

const localizedNameSchema = {
  bsonType: 'object',
  required: ['en', 'es', 'pt-BR'],
  properties: {
    'en': { bsonType: 'string', minLength: 1, maxLength: 80 },
    'es': { bsonType: 'string', minLength: 1, maxLength: 80 },
    'pt-BR': { bsonType: 'string', minLength: 1, maxLength: 80 },
  },
  additionalProperties: false,
};

const categoryCollectionSchema = {
  title: 'Category',
  bsonType: 'object',
  required: ['_id', 'active', 'color', 'kind', 'level', 'name', 'parentId'],
  properties: {
    _id: { bsonType: 'objectId' },
    name: localizedNameSchema,
    active: { bsonType: 'bool' },
    color: { bsonType: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
    parentId: { bsonType: ['objectId', 'null'] },
    kind: { enum: [...CATEGORY_KINDS] },
    level: { enum: [...CATEGORY_LEVELS] },
  },
  additionalProperties: false,
} as Document;

async function setup(): Promise<Collection<Category>> {
  const { db } = await getClient(env.MONGODB_ADMIN_CERT_PATH);
  const collection = await ensureCollection<Category>(db, collectionName, {
    validator: { $jsonSchema: categoryCollectionSchema },
    validationLevel: 'strict',
    validationAction: 'error',
  });

  await ensureIndexes(collection, [
    { key: { kind: 1, level: 1, active: 1 }, name: 'kind-level-active' },
    { key: { parentId: 1, active: 1 }, name: 'parent-active' },
    {
      key: { 'kind': 1, 'level': 1, 'parentId': 1, 'name.en': 1 },
      name: 'unique-name-en',
      unique: true,
      partialFilterExpression: { 'name.en': { $type: 'string' } },
    },
    {
      key: { 'kind': 1, 'level': 1, 'parentId': 1, 'name.es': 1 },
      name: 'unique-name-es',
      unique: true,
      partialFilterExpression: { 'name.es': { $type: 'string' } },
    },
    {
      key: { 'kind': 1, 'level': 1, 'parentId': 1, 'name.pt-BR': 1 },
      name: 'unique-name-pt-br',
      unique: true,
      partialFilterExpression: { 'name.pt-BR': { $type: 'string' } },
    },
  ]);

  return collection;
}

export { setup };
