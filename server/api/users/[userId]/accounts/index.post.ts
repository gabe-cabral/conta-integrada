import z from 'zod';
import AccountsRepo from '~~/server/repositories/AccountsRepo';
import { bankAccountCreateSchema } from '~~/shared/schemas/bankAccounts.js';

const routeSchema = z.object({
  userId: z.string().length(24),
});

export default defineEventHandler(async (event) => {
  const params = await getValidatedRouterParams(event, routeSchema.parse);
  const { user } = await requireUserSession(event);

  if (user.id !== params.userId) {
    throw createError({ statusCode: 403, message: 'Forbidden' });
  }

  const body = await readValidatedBody(event, bankAccountCreateSchema.parse);
  const repository = new AccountsRepo(user.id);
  const id = await repository.insertRecord(body);

  if (!id) {
    throw createError({ statusCode: 500, message: 'Failed to create account' });
  }

  const account = await repository.getRecordById(id);

  if (!account) {
    throw createError({ statusCode: 500, message: 'Failed to load created account' });
  }

  return account;
});
