import CategoriesRepo from '~~/server/repositories/CategoriesRepo';
import { zodObjectId } from '~~/shared/zod/mongodb';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

const routeSchema = z.strictObject({ categoryId: zodObjectId });

export default defineEventHandler(async (event) => {
  requireInternalApiAccess(event);
  const { categoryId } = await getValidatedRouterParams(event, routeSchema.parse);
  const objectId = ObjectId.createFromHexString(categoryId);
  const { db } = await useSecureClient();
  const hasChildren = await db.collection('categories').findOne({ parentId: objectId });
  const isConfigured = await db.collection('user_categories').findOne({
    catalogCategoryId: objectId,
  });

  if (hasChildren || isConfigured) {
    throw createError({
      statusCode: 409,
      message: 'The category is referenced and must be deactivated instead',
    });
  }

  const result = await new CategoriesRepo().deleteRecord(categoryId);
  if (result.deletedCount === 0)
    throw createError({ statusCode: 404, message: 'Category not found' });

  setResponseStatus(event, 204);
  return null;
});
