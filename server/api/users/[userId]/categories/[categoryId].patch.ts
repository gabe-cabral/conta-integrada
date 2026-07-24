import { assertCustomNameDoesNotMatchCatalog } from '~~/server/utils/categoryHierarchy';
import UserCategoriesRepo from '~~/server/repositories/UserCategoriesRepo';
import { userCategoryUpdateSchema } from '~~/shared/schemas/categories';
import { zodObjectId } from '~~/shared/zod/mongodb';
import { ObjectId } from 'mongodb';
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

  const changes = await readValidatedBody(event, userCategoryUpdateSchema.parse);
  const repository = new UserCategoriesRepo(userId);
  const current = await repository.getRecordById(categoryId);

  if (!current) throw createError({ statusCode: 404, message: 'Category not found' });
  if (
    current.catalogCategoryId
    && (changes.name !== undefined || changes.color !== undefined)
  ) {
    throw createError({
      statusCode: 403,
      message: 'Catalog categories cannot be customized',
    });
  }

  if (!current.catalogCategoryId && changes.name !== undefined) {
    const parent = current.parentId
      ? await repository.getRecordById(current.parentId.toString())
      : null;
    await assertCustomNameDoesNotMatchCatalog(current, changes.name, parent);
  }

  const result = await repository.updateRecord(categoryId, changes);
  if (result.matchedCount === 0)
    throw createError({ statusCode: 404, message: 'Category not found' });

  if (current.level === 'CATEGORY' && changes.active === false) {
    const { db } = await useSecureClient();
    await db.collection('user_categories').updateMany(
      {
        userId: ObjectId.createFromHexString(userId),
        parentId: ObjectId.createFromHexString(categoryId),
      },
      { $set: { active: false, updatedAt: new Date() } },
    );
  }

  return repository.getRecordById(categoryId);
});
