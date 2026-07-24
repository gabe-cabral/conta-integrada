import UserCategoriesRepo from '~~/server/repositories/UserCategoriesRepo';
import CategoriesRepo from '~~/server/repositories/CategoriesRepo';
import { zodObjectId } from '~~/shared/zod/mongodb';
import { z } from 'zod';

const routeSchema = z.strictObject({ userId: zodObjectId });

export default defineEventHandler(async (event) => {
  const { userId } = await getValidatedRouterParams(event, routeSchema.parse);
  const { user } = await requireUserSession(event);
  if (user.id !== userId) throw createError({ statusCode: 403, message: 'Forbidden' });

  const [catalog, categories] = await Promise.all([
    new CategoriesRepo().listCategories(),
    new UserCategoriesRepo(userId).getConfiguredCategories(),
  ]);

  return { catalog, categories };
});
