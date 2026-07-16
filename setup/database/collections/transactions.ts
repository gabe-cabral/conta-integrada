import zodToMongoSchema from 'zod-to-mongo-schema';
import { MongoServerError } from 'mongodb';

import type { Transaction } from '#shared/types/transactions.ts';
import type { Collection } from 'mongodb';

import { transactionsSchema } from '#server/repositories/TransactionsRepo.ts';
import { getClient } from '../client.ts';
import { env } from '../../../env.ts';

async function setup(): Promise<Collection<Transaction> | null> {
  const collectionName = 'transactions';
  const { db } = await getClient(env.MONGODB_ADMIN_CERT_PATH);

  // Convert to MongoDB JSON Schema
  const mongoSchema = zodToMongoSchema(transactionsSchema);

  try {
    const coll = await db.createCollection<Transaction>(collectionName, {
      validator: { $jsonSchema: mongoSchema },
      validationLevel: 'strict',
      validationAction: 'error',
    });

    console.log(`Collection "${collectionName}" successfully created!`);

    await coll.createIndexes([
      { key: { userId: 1 }, name: 'user-date', partialFilterExpression: { date: -1 } },
      { key: { userId: 1 }, name: 'user-id' },
    ]);

    return coll;
  } catch (error) {
    if (error instanceof MongoServerError && error.codeName === 'NamespaceExists') {
      console.log(`A coleção '${collectionName}' já existe.`);

      try {
        await db.command({
          collMod: collectionName,
          validator,
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
