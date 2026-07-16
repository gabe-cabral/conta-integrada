import type { Transaction } from '#shared/types/transactions.ts';

import TransactionsRepo from '#server/repositories/TransactionsRepo.ts';

async function load(userId: string) {
  const transactionRepo = new TransactionsRepo();

  const transaction: Omit<Transaction, '_id'> = {
    userId,
    date: new Date('2026-01-01T00:00:00.000Z'),
    description: 'Grocery shopping',
    amount: {
      amountInCents: 5000,
      currency: 'USD',
    },
    type: 'EXPENSE',
    status: 'CONFIRMED',
    categoryId: null,
    sourceId: '60c72b2f9b1d4c3a5f0e4d1c',
    sourceType: 'CHECKING',
    destinationId: null,
    destinationType: null,
    tags: [],
    attachmentsCount: 0,
    hasRecurrence: false,
    createdAt: new Date(),
  };

  const data = [transaction];

  try {
    const result = await transactionRepo.insertManyTransactions(data);
    console.log(`✅ ${result.insertedCount} transações inseridas.`);
  } catch (error) {
    console.error(JSON.stringify(error, null, 2));
  }
}

export { load };
