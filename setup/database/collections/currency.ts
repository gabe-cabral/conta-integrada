import { MongoServerError } from 'mongodb';

import type { Currency } from '#shared/schemas/currency.ts';
import type { Collection, Document } from 'mongodb';

import { getClient } from '../client.ts';
import { env } from '../../../env.ts';

const collectionName = 'currency';

const currencyCollectionSchema = {
  title: 'Currency',
  bsonType: 'object',
  required: ['_id', 'active', 'countryUsage', 'minorUnit', 'names'],
  properties: {
    _id: {
      bsonType: 'string',
      pattern: '^[A-Z]{3}$',
      description: 'ISO 4217 alphabetic currency code',
    },
    names: {
      bsonType: 'object',
      required: ['en'],
      description: 'Localized currency names keyed by BCP 47 locale tag',
      properties: {
        en: { bsonType: 'string' },
      },
      patternProperties: {
        '^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$': { bsonType: 'string' },
      },
      additionalProperties: false,
    },
    symbol: {
      bsonType: 'string',
      description: 'Display symbol, not a unique identifier',
    },
    numericCode: {
      bsonType: 'string',
      pattern: '^[0-9]{3}$',
      description: 'ISO 4217 numeric code stored as a string',
    },
    minorUnit: {
      bsonType: 'int',
      minimum: 0,
      description: 'Conventional number of decimal places',
    },
    countryUsage: {
      bsonType: 'array',
      description: 'Countries or territories where this currency is used',
      items: {
        bsonType: 'object',
        required: ['countryCode', 'type'],
        properties: {
          countryCode: {
            bsonType: 'string',
            pattern: '^[A-Z]{3}$',
            description: 'ISO 3166-1 alpha-3 country code',
          },
          type: {
            enum: ['official', 'officialParallel', 'widelyAccepted'],
            description: 'Currency usage type in the country or territory',
          },
        },
        additionalProperties: false,
      },
    },
    active: {
      bsonType: 'bool',
      description: 'Whether the currency is active in the catalog',
    },
  },
  additionalProperties: false,
} as Document;

async function setup(): Promise<Collection<Currency> | null> {
  const { db } = await getClient(env.MONGODB_ADMIN_CERT_PATH);

  try {
    const coll = await db.createCollection<Currency>(collectionName, {
      validator: { $jsonSchema: currencyCollectionSchema },
      validationLevel: 'strict',
      validationAction: 'error',
    });

    console.log(`Collection "${collectionName}" successfully created!`);

    await createIndexes(coll);

    return coll;
  } catch (error) {
    if (error instanceof MongoServerError && error.codeName === 'NamespaceExists') {
      console.log(`A coleção '${collectionName}' já existe.`);

      try {
        await db.command({
          collMod: collectionName,
          validator: { $jsonSchema: currencyCollectionSchema },
          validationLevel: 'strict',
          validationAction: 'error',
        });

        const coll = db.collection<Currency>(collectionName);
        await createIndexes(coll);

        console.log(`Schema da coleção '${collectionName}' atualizado!`);
      } catch (errorDbCommand) {
        if (errorDbCommand instanceof MongoServerError) {
          console.error('Erro do MongoDB ao atualizar schema:', errorDbCommand.message);
        }

        throw errorDbCommand;
      }
    } else {
      console.error('Erro ao criar coleção:', error);
    }

    return null;
  }
}

async function createIndexes(coll: Collection<Currency>) {
  await coll.createIndexes([
    { key: { 'countryUsage.countryCode': 1, 'active': 1 }, name: 'country-usage-active' },
  ]);
}

export { setup };
