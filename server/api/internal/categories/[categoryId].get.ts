import CategoriesRepo from '~~/server/repositories/CategoriesRepo';
import { zodObjectId } from '~~/shared/zod/mongodb';
import { z } from 'zod';

const routeSchema = z.strictObject({ categoryId: zodObjectId });

export default defineEventHandler(async (event) => {
  requireInternalApiAccess(event);
  const { categoryId } = await getValidatedRouterParams(event, routeSchema.parse);
  const category = await new CategoriesRepo().getRecordById(categoryId);

  if (!category) throw createError({ statusCode: 404, message: 'Category not found' });
  return category;
});
