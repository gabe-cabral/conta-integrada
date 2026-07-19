import zodToMongoSchema from 'zod-to-mongo-schema';

import type { Transaction } from '#shared/types/transactions.ts';
import type { Collection } from 'mongodb';

import { transactionsSchema } from '#shared/schemas/transactionPersistence.ts';

import { ensureCollection, ensureIndexes } from '../helper.ts';
import { getClient } from '../client.ts';
import { env } from '../../../env.ts';

async function setup(): Promise<Collection<Transaction>> {
  const collectionName = 'transactions';
  const { db } = await getClient(env.MONGODB_ADMIN_CERT_PATH);
  const mongoSchema = zodToMongoSchema(transactionsSchema);
  const collection = await ensureCollection<Transaction>(db, collectionName, {
    validator: { $jsonSchema: mongoSchema },
    validationLevel: 'strict',
    validationAction: 'error',
  });

  await ensureIndexes(collection, [
    { key: { userId: 1, date: -1 }, name: 'user-date' },
    { key: { userId: 1 }, name: 'user-id' },
  ]);

  return collection;
}

export { setup };
