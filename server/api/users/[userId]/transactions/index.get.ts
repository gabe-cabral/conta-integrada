import TransactionsRepo from '~~/server/repositories/TransactionsRepo';
import { dateStringToDate } from '~~/shared/zod/zodDate';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

import type { UserTransactionsRequestQuery } from '~~/shared/types/transactions';

const repository = new TransactionsRepo();

const querySchema: z.ZodType<any, UserTransactionsRequestQuery> = z.strictObject({
  dateStart: dateStringToDate,
  dateEnd: dateStringToDate.optional(),
});

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const { dateStart, dateEnd } = await getValidatedQuery(event, querySchema.parse) as z.output<typeof querySchema>;

  try {
    const userId = ObjectId.createFromHexString(user.id);

    return repository.getUserTransactions(userId, dateStart, dateEnd);
  } catch (error) {
    event.node.res.statusCode = 500;
    return { error: 'Internal Server Error', details: error };
  }
});
