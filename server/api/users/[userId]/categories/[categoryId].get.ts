import UserCategoriesRepo from '~~/server/repositories/UserCategoriesRepo';
import { zodObjectId } from '~~/shared/zod/mongodb';
import { z } from 'zod';

const routeSchema = z.strictObject({
  userId: zodObjectId,
  categoryId: zodObjectId,
});

export default defineEventHandler(async (event) => {
  const { userId, categoryId } = await getValidatedRouterParams(
    event,
    routeSchema.parse,
  );
  const { user } = await requireUserSession(event);
  if (user.id !== userId) throw createError({ statusCode: 403, message: 'Forbidden' });

  const category = await new UserCategoriesRepo(userId)
    .getRecordById(categoryId);

  if (!category) throw createError({ statusCode: 404, message: 'Category not found' });
  return category;
});
