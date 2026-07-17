import type { Transaction, UserTransactionsRequestQuery } from '#shared/types/transactions';

export function parseTransaction(tx: Transaction): Transaction {
  return {
    ...tx,
    date: new Date(tx.date),
    createdAt: new Date(tx.createdAt),
    updatedAt: tx.updatedAt ? new Date(tx.updatedAt) : undefined,
    recurrence: tx.recurrence
      ? {
          ...tx.recurrence,
          endDate: tx.recurrence.endDate ? new Date(tx.recurrence.endDate) : undefined,
        }
      : undefined,
  } as Transaction;
}

export async function useUserTransactions(
  userId: string,
  query: UserTransactionsRequestQuery,
): Promise<Transaction[]> {
  const { $userApi } = useNuxtApp();

  const result = await $userApi<Transaction[]>('/transactions', {
    method: 'GET',
    query,
  });

  return result.map(parseTransaction);
}
