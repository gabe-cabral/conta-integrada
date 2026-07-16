import { MongoServerError } from 'mongodb';

import type { FinancialInstitution } from '../../../shared/schemas/financialInstitutions.ts';
import type { Collection, Document, ObjectId } from 'mongodb';

import { getClient } from '../client.ts';
import { env } from '../../../env.ts';

const collectionName = 'financial_institutions';

type FinancialInstitutionDocument = Omit<FinancialInstitution, '_id'> & {
  _id?: ObjectId
};

const financialInstitutionCollectionSchema = {
  title: 'FinancialInstitution',
  bsonType: 'object',
  required: [
    '_id',
    'countryCode',
    'createdAt',
    'defaultCurrencies',
    'identifiers',
    'institutionType',
    'name',
    'sources',
    'status',
    'type',
    'updatedAt',
  ],
  properties: {
    _id: {
      bsonType: 'objectId',
      description: 'Stable internal institution id',
    },
    type: {
      enum: ['BankOrCreditUnion'],
      description: 'Schema.org-compatible institution type',
    },
    countryCode: {
      bsonType: 'string',
      pattern: '^[A-Z]{2}$',
      description: 'ISO 3166-1 alpha-2 country code',
    },
    name: {
      bsonType: 'string',
      description: 'Official or short name used for search',
    },
    displayName: {
      bsonType: 'string',
      description: 'Friendly commercial name shown to users',
    },
    legalName: {
      bsonType: 'string',
      description: 'Legal name published by official sources',
    },
    alternateNames: {
      bsonType: 'array',
      items: { bsonType: 'string' },
      description: 'Alternative names and abbreviations used for search',
    },
    url: {
      bsonType: 'string',
      description: 'Official website URL',
    },
    status: {
      enum: ['active', 'inactive', 'merged', 'suspended', 'unknown'],
      description: 'Operational status of the institution',
    },
    institutionType: {
      enum: ['bank', 'brokerage', 'central_bank', 'credit_union', 'digital_wallet', 'other', 'payment_institution'],
      description: 'Business classification used by the application',
    },
    defaultCurrencies: {
      bsonType: 'array',
      minItems: 1,
      description: 'ISO 4217 currencies normally accepted by the institution',
      items: {
        bsonType: 'string',
        pattern: '^[A-Z]{3}$',
      },
    },
    identifiers: {
      bsonType: 'array',
      minItems: 1,
      description: 'Flexible identifiers used for deduplication and matching',
      items: {
        bsonType: 'object',
        required: ['scheme', 'value'],
        properties: {
          scheme: { bsonType: 'string' },
          value: { bsonType: 'string' },
          issuer: { bsonType: 'string' },
          countryCode: { bsonType: 'string', pattern: '^[A-Z]{2}$' },
          primary: { bsonType: 'bool' },
          confidence: { enum: ['community', 'inferred', 'official', 'unknown', 'verified'] },
          validFrom: { bsonType: 'date' },
          validUntil: { bsonType: 'date' },
        },
        additionalProperties: false,
      },
    },
    regulatoryRegistrations: {
      bsonType: 'array',
      description: 'Regulatory authorizations and participation records',
      items: {
        bsonType: 'object',
        required: ['authority', 'authorityCountryCode', 'registrationType'],
        properties: {
          authority: { bsonType: 'string' },
          authorityCountryCode: { bsonType: 'string', pattern: '^[A-Z]{2}$' },
          registrationType: { bsonType: 'string' },
          registrationId: { bsonType: 'string' },
          status: { enum: ['active', 'inactive', 'merged', 'suspended', 'unknown'] },
          startedAt: { bsonType: 'date' },
          endedAt: { bsonType: 'date' },
        },
        additionalProperties: false,
      },
    },
    branding: {
      bsonType: 'object',
      description: 'Logo and visual metadata',
      properties: {
        logoUrl: { bsonType: ['null', 'string'] },
        logoKey: { bsonType: ['null', 'string'] },
        logoSource: { bsonType: ['null', 'string'] },
        brandColor: { bsonType: ['null', 'string'], pattern: '^#[0-9A-Fa-f]{6}$' },
        verified: { bsonType: 'bool' },
      },
      additionalProperties: false,
    },
    sources: {
      bsonType: 'array',
      minItems: 1,
      description: 'Traceability references for loaded data',
      items: {
        bsonType: 'object',
        required: ['confidence', 'retrievedAt', 'sourceName'],
        properties: {
          sourceName: { bsonType: 'string' },
          sourceUrl: { bsonType: 'string' },
          retrievedAt: { bsonType: 'date' },
          confidence: { enum: ['community', 'inferred', 'official', 'unknown', 'verified'] },
        },
        additionalProperties: false,
      },
    },
    createdAt: {
      bsonType: 'date',
      description: 'Record creation timestamp',
    },
    updatedAt: {
      bsonType: ['date', 'null'],
      description: 'Last application update timestamp',
    },
    lastSyncedAt: {
      bsonType: ['date', 'null'],
      description: 'Last automated synchronization timestamp',
    },
  },
  additionalProperties: false,
} as Document;

async function setup(): Promise<Collection<FinancialInstitutionDocument> | null> {
  const { db } = await getClient(env.MONGODB_ADMIN_CERT_PATH);

  try {
    const coll = await db.createCollection<FinancialInstitutionDocument>(collectionName, {
      validator: { $jsonSchema: financialInstitutionCollectionSchema },
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
          validator: { $jsonSchema: financialInstitutionCollectionSchema },
          validationLevel: 'strict',
          validationAction: 'error',
        });

        const coll = db.collection<FinancialInstitutionDocument>(collectionName);
        await createIndexes(coll);

        console.log(`Schema da coleção '${collectionName}' atualizado!`);
      } catch (error) {
        if (error instanceof MongoServerError) {
          console.error('Erro do MongoDB ao atualizar schema:', error.message);
        }

        throw error;
      }
    } else {
      console.error('Erro ao criar coleção:', error);
    }

    return null;
  }
}

async function createIndexes(coll: Collection<FinancialInstitutionDocument>) {
  await coll.createIndexes([
    { key: { 'identifiers.scheme': 1, 'identifiers.value': 1 }, name: 'identifier-scheme-value' },
    {
      key: {
        countryCode: 1,
        displayName: 'text',
        name: 'text',
        legalName: 'text',
        alternateNames: 'text',
      },
      name: 'institution-search',
    },
    { key: { countryCode: 1, status: 1, name: 1 }, name: 'country-status-name' },
    { key: { defaultCurrencies: 1, countryCode: 1, status: 1 }, name: 'currency-country-status' },
  ]);
}

export { setup };
