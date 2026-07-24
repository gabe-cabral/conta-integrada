import UserCategoriesRepo from '~~/server/repositories/UserCategoriesRepo';
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

  const repository = new UserCategoriesRepo(userId);
  const current = await repository.getRecordById(categoryId);
  if (!current) throw createError({ statusCode: 404, message: 'Category not found' });

  await repository.updateRecord(categoryId, { active: false });
  if (current.level === 'CATEGORY') {
    const { db } = await useSecureClient();
    await db.collection('user_categories').updateMany(
      {
        userId: ObjectId.createFromHexString(userId),
        parentId: ObjectId.createFromHexString(categoryId),
      },
      { $set: { active: false, updatedAt: new Date() } },
    );
  }

  setResponseStatus(event, 204);
  return null;
});
