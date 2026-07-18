import { MongoServerError } from 'mongodb';

import type { ExchangeRateSnapshotDocument } from '#server/utils/exchangeRateSnapshots.ts';
import type { Collection, Document } from 'mongodb';

import { getClient } from '../client.ts';
import { env } from '../../../env.ts';

const collectionName = 'exchange_rate_snapshots';

const exchangeRateSnapshotCollectionSchema = {
  title: 'ExchangeRateSnapshot',
  bsonType: 'object',
  required: [
    '_id',
    'baseCurrency',
    'carriedForward',
    'createdAt',
    'provider',
    'rates',
    'status',
    'updatedAt',
    'valuationDate',
  ],
  properties: {
    _id: {
      bsonType: 'string',
      pattern: '^[A-Z]{3}_\\d{4}-\\d{2}-\\d{2}$',
      description: 'Stable snapshot id in the BASE_YYYY-MM-DD format',
    },
    valuationDate: {
      bsonType: 'date',
      description: 'UTC day represented by this snapshot',
    },
    baseCurrency: {
      bsonType: 'string',
      pattern: '^[A-Z]{3}$',
      description: 'Canonical base currency for all rates',
    },
    rates: {
      bsonType: 'object',
      description: 'Currency rates stored as BSON Decimal128',
      patternProperties: {
        '^[A-Z]{3}$': { bsonType: 'decimal' },
      },
      additionalProperties: false,
    },
    provider: {
      bsonType: 'object',
      required: ['name', 'retrievedAt'],
      properties: {
        name: {
          bsonType: 'string',
          description: 'Exchange rate data provider name',
        },
        referenceDate: {
          bsonType: 'date',
          description: 'Date referenced by provider data',
        },
        timestamp: {
          bsonType: 'date',
          description: 'Provider timestamp for the data',
        },
        retrievedAt: {
          bsonType: 'date',
          description: 'Timestamp when the data was retrieved',
        },
      },
      additionalProperties: false,
    },
    carriedForward: {
      bsonType: 'bool',
      description: 'Whether this snapshot was carried forward from a previous date',
    },
    status: {
      enum: ['complete', 'partial'],
      description: 'Snapshot completeness status',
    },
    expectedCurrencies: {
      bsonType: 'array',
      items: {
        bsonType: 'string',
        pattern: '^[A-Z]{3}$',
      },
    },
    missingCurrencies: {
      bsonType: 'array',
      items: {
        bsonType: 'string',
        pattern: '^[A-Z]{3}$',
      },
    },
    createdAt: {
      bsonType: 'date',
      description: 'Server-controlled creation timestamp',
    },
    updatedAt: {
      bsonType: 'date',
      description: 'Server-controlled update timestamp',
    },
  },
  additionalProperties: false,
} as Document;

async function setup(): Promise<Collection<ExchangeRateSnapshotDocument> | null> {
  const { db } = await getClient(env.MONGODB_ADMIN_CERT_PATH);

  try {
    const coll = await db.createCollection<ExchangeRateSnapshotDocument>(collectionName, {
      validator: { $jsonSchema: exchangeRateSnapshotCollectionSchema },
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
          validator: { $jsonSchema: exchangeRateSnapshotCollectionSchema },
          validationLevel: 'strict',
          validationAction: 'error',
        });

        const coll = db.collection<ExchangeRateSnapshotDocument>(collectionName);
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

async function createIndexes(coll: Collection<ExchangeRateSnapshotDocument>) {
  await coll.createIndexes([
    {
      key: { baseCurrency: 1, status: 1, valuationDate: -1 },
      name: 'base-currency-status-valuation-date-desc',
    },
    {
      key: { baseCurrency: 1, valuationDate: 1 },
      name: 'base-currency-valuation-date',
      unique: true,
    },
  ]);
}

export { setup };
