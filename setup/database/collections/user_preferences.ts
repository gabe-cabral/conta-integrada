import { MongoServerError } from 'mongodb';

import type { UserPreference } from '../../../shared/schemas/userPreferences.ts';
import type { Collection, Document } from 'mongodb';

import { getClient } from '../client.ts';
import { env } from '../../../env.ts';

const collectionName = 'user_preferences';

const userPreferencesCollectionSchema = {
  title: 'UserPreference',
  bsonType: 'object',
  required: ['currencies', 'defaultCurrency', 'userId'],
  properties: {
    _id: { bsonType: 'objectId' },
    userId: { bsonType: 'objectId' },
    createdAt: { bsonType: 'date' },
    updatedAt: { bsonType: ['date', 'null'] },
    defaultCurrency: { bsonType: 'string', pattern: '^[A-Z]{3}$' },
    currencies: {
      bsonType: 'array',
      minItems: 1,
      items: { bsonType: 'string', pattern: '^[A-Z]{3}$' },
    },
  },
  additionalProperties: false,
} as Document;

async function createIndexes(collection: Collection<UserPreference>) {
  await collection.createIndex({ userId: 1 }, { name: 'user-id', unique: true });
}

async function setup(): Promise<Collection<UserPreference> | null> {
  const { db } = await getClient(env.MONGODB_ADMIN_CERT_PATH);

  try {
    const collection = await db.createCollection<UserPreference>(collectionName, {
      validator: { $jsonSchema: userPreferencesCollectionSchema },
      validationLevel: 'strict',
      validationAction: 'error',
    });

    await createIndexes(collection);
    console.log(`Collection "${collectionName}" successfully created!`);
    return collection;
  } catch (error) {
    if (!(error instanceof MongoServerError) || error.codeName !== 'NamespaceExists') {
      console.error('Erro ao criar coleção:', error);
      return null;
    }

    await db.command({
      collMod: collectionName,
      validator: { $jsonSchema: userPreferencesCollectionSchema },
      validationLevel: 'strict',
      validationAction: 'error',
    });

    const collection = db.collection<UserPreference>(collectionName);
    await createIndexes(collection);
    console.log(`Schema da coleção '${collectionName}' atualizado!`);
    return collection;
  }
}

export { setup };
