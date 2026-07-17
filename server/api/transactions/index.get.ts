import TransactionsRepo from '~~/server/repositories/TransactionsRepo';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

const repository = new TransactionsRepo();

const querySchema = z.strictObject({
  dateStart: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), { message: 'Invalid date format' })
    .transform((date) => new Date(date)),
  dateEnd: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), { message: 'Invalid date format' })
    .transform((date) => new Date(date))
    .optional(),
});

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const { dateStart, dateEnd } = (await getValidatedQuery(event, querySchema.parse)) as z.output<
    typeof querySchema
  >;

  try {
    const userId = ObjectId.createFromHexString(user.id);

    return repository.getUserTransactions(userId, dateStart, dateEnd);
  } catch (error) {
    event.node.res.statusCode = 500;
    return { error: 'Internal Server Error', details: error };
  }
});
