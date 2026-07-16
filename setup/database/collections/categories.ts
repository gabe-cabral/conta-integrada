import { MongoServerError } from 'mongodb';

import type { TransactionCategory } from '#shared/types/transactions.ts';
import type { Collection } from 'mongodb';

import { categorySchema } from '#server/repositories/CategoriesRepo.ts';
import { getClient } from '../client.ts';
import { env } from '../../../env.ts';

async function setup(): Promise<Collection<TransactionCategory> | null> {
  const collectionName = 'categories';
  const { db } = await getClient(env.MONGODB_ADMIN_CERT_PATH);

  try {
    const coll = await db.createCollection<TransactionCategory>(collectionName, {
      validator: {
        $jsonSchema: categorySchema,
      },
      validationLevel: 'strict',
      validationAction: 'error',
    });

    console.log('Collection "categories" successfully created!');

    await coll.createIndexes([
      { key: { userId: 1 }, name: 'user-actives', partialFilterExpression: { active: true } },
      { key: { userId: 1 }, name: 'user-id' },
    ]);

    return coll;
  } catch (error) {
    if (error instanceof MongoServerError && error.codeName === 'NamespaceExists') {
      console.log(`A coleção '${collectionName}' já existe.`);

      try {
        await db.command({
          collMod: collectionName,
          validator: { $jsonSchema: categorySchema },
          validationLevel: 'strict',
          validationAction: 'error',
        });

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

export { setup };
