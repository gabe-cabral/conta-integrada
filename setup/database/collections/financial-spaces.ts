import { MongoServerError } from 'mongodb';

import type { FinancialSpace } from '#shared/schemas/financialSpaces.ts';
import type { Collection, Document } from 'mongodb';

import { FINANCIAL_SPACE_ICONS } from '#shared/schemas/financialSpaces.ts';
import { getClient } from '../client.ts';
import { env } from '../../../env.ts';

const collectionName = 'financial_spaces';

const financialSpacesCollectionSchema = {
  title: 'FinancialSpace',
  bsonType: 'object',
  required: [
    '_id',
    'categoryIds',
    'categoryMode',
    'createdAt',
    'name',
    'showOnDashboard',
    'updatedAt',
    'userId',
  ],
  properties: {
    _id: { bsonType: 'objectId' },
    userId: { bsonType: 'objectId' },
    name: { bsonType: 'binData', description: 'Encrypted financial space name' },
    description: { bsonType: 'binData', description: 'Encrypted optional description' },
    icon: { bsonType: 'string', enum: [...FINANCIAL_SPACE_ICONS] },
    color: { bsonType: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
    categoryMode: { enum: ['all', 'selected'] },
    categoryIds: {
      bsonType: 'array',
      uniqueItems: true,
      items: { bsonType: 'objectId' },
    },
    currencies: {
      bsonType: 'array',
      minItems: 1,
      uniqueItems: true,
      items: { bsonType: 'string', pattern: '^[A-Z]{3}$' },
    },
    showOnDashboard: { bsonType: 'bool' },
    createdAt: { bsonType: 'date' },
    updatedAt: { bsonType: ['date', 'null'] },
  },
  additionalProperties: false,
} as Document;

async function createIndexes(collection: Collection<FinancialSpace>) {
  await collection.createIndexes([
    { key: { userId: 1, categoryIds: 1 }, name: 'user-categories' },
    { key: { userId: 1, createdAt: 1 }, name: 'user-created-at' },
    { key: { userId: 1, showOnDashboard: 1 }, name: 'user-dashboard' },
  ]);
}

async function setup(): Promise<Collection<FinancialSpace> | null> {
  const { db } = await getClient(env.MONGODB_ADMIN_CERT_PATH);

  try {
    const collection = await db.createCollection<FinancialSpace>(collectionName, {
      validator: { $jsonSchema: financialSpacesCollectionSchema },
      validationLevel: 'strict',
      validationAction: 'error',
    });

    await createIndexes(collection);
    console.log(`Collection "${collectionName}" successfully created!`);
    return collection;
  } catch (error) {
    if (!(error instanceof MongoServerError) || error.codeName !== 'NamespaceExists') {
      console.error('Erro ao criar colecao:', error);
      return null;
    }

    await db.command({
      collMod: collectionName,
      validator: { $jsonSchema: financialSpacesCollectionSchema },
      validationLevel: 'strict',
      validationAction: 'error',
    });

    const collection = db.collection<FinancialSpace>(collectionName);
    await createIndexes(collection);
    console.log(`Schema da colecao '${collectionName}' atualizado!`);
    return collection;
  }
}

export { setup };
