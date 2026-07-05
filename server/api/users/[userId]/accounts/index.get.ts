import z from 'zod';
import AccountsRepo from '~~/server/repositories/AccountsRepo';

const routeSchema = z.object({
  userId: z.string().length(24),
});

export default defineEventHandler(async (event) => {
  const params = await getValidatedRouterParams(event, routeSchema.parse);

  const { user } = await requireUserSession(event);

  if (user.id !== params.userId) {
    throw createError({ statusCode: 403, message: 'Forbidden' });
  }

  const repository = new AccountsRepo(user.id);

  return repository.getUserRecords();
});
