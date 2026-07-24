import { ObjectId } from 'mongodb';

import type { Category } from '#shared/schemas/categories.ts';
import type { AnyBulkWriteOperation } from 'mongodb';

import { CATEGORY_KINDS, CATEGORY_LEVELS } from '#shared/constants/categories.ts';

import data from './categories-catalog.json' with { type: 'json' };
import { getClient } from '../database/client.ts';

type CategoryDbDocument = Omit<Category, '_id' | 'parentId'> & {
  _id: ObjectId
  parentId: ObjectId | null
};

if (!Array.isArray(data)) throw new Error('Category data is not a list.');
const seedCategories = data.map((item) => parseCategory(item));

async function load() {
  const { db } = await getClient();
  const collection = db.collection<CategoryDbDocument>('categories');
  const documents = seedCategories.map(mapData);
  const operations: AnyBulkWriteOperation<CategoryDbDocument>[] = documents.map(
    (document) => ({
      replaceOne: {
        filter: { _id: document._id },
        replacement: document,
        upsert: true,
      },
    }),
  );
  const result = await collection.bulkWrite(operations, { ordered: false });

  console.log(
    `${result.upsertedCount} categorias do catálogo inseridas; `
    + `${result.modifiedCount} atualizadas; `
    + `${result.matchedCount - result.modifiedCount} já estavam atualizadas.`,
  );
}

function mapData(category: Category): CategoryDbDocument {
  return {
    ...category,
    _id: ObjectId.createFromHexString(category._id),
    parentId: category.parentId
      ? ObjectId.createFromHexString(category.parentId)
      : null,
  };
}

function parseCategory(value: unknown): Category {
  if (!isCategory(value)) throw new Error('Invalid category seed record.');
  return value;
}

function isCategory(value: unknown): value is Category {
  if (!value || typeof value !== 'object') return false;

  const category = value as Record<string, unknown>;
  const name = category.name as Record<string, unknown> | undefined;
  const parentId = category.parentId;

  return (
    typeof category._id === 'string'
    && ObjectId.isValid(category._id)
    && Boolean(name)
    && typeof name?.en === 'string'
    && name.en.length > 0
    && typeof name.es === 'string'
    && name.es.length > 0
    && typeof name['pt-BR'] === 'string'
    && name['pt-BR'].length > 0
    && typeof category.active === 'boolean'
    && typeof category.color === 'string'
    && /^#[0-9a-f]{6}$/i.test(category.color)
    && (parentId === null
      || (typeof parentId === 'string' && ObjectId.isValid(parentId)))
    && CATEGORY_KINDS.includes(category.kind as never)
    && CATEGORY_LEVELS.includes(category.level as never)
    && (category.level === 'CATEGORY'
      ? parentId === null
      : parentId !== null)
  );
}

export { load };
