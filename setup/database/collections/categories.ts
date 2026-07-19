import type { TransactionCategory } from '#shared/types/transactions.ts';
import type { Collection } from 'mongodb';

import { categorySchema } from '#server/repositories/CategoriesRepo.ts';

import { ensureCollection, ensureIndexes } from '../helper.ts';
import { getClient } from '../client.ts';
import { env } from '../../../env.ts';

async function setup(): Promise<Collection<TransactionCategory>> {
  const collectionName = 'categories';
  const { db } = await getClient(env.MONGODB_ADMIN_CERT_PATH);
  const collection = await ensureCollection<TransactionCategory>(db, collectionName, {
    validator: { $jsonSchema: categorySchema },
    validationLevel: 'strict',
    validationAction: 'error',
  });

  await ensureIndexes(collection, [
    { key: { userId: 1 }, name: 'user-actives', partialFilterExpression: { active: true } },
    { key: { userId: 1 }, name: 'user-id' },
  ]);

  return collection;
}

export { setup };
