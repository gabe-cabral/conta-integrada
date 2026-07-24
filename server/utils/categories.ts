import { ObjectId } from 'mongodb';

export async function assertCategoriesBelongToUser(
  userId: string,
  categoryIds: string[],
  options: { activeOnly?: boolean } = {},
): Promise<void> {
  if (categoryIds.length === 0) return;

  const uniqueIds = [...new Set(categoryIds)];
  const { db } = await useSecureClient();
  const categories = db.collection('user_categories');
  const filter = {
    _id: {
      $in: uniqueIds.map((categoryId) =>
        ObjectId.createFromHexString(categoryId)),
    },
    userId: ObjectId.createFromHexString(userId),
    ...(options.activeOnly ? { active: true } : {}),
  };
  const existingCategories = await categories.countDocuments(filter);

  if (existingCategories !== uniqueIds.length) {
    throw createError({
      statusCode: 422,
      message: options.activeOnly
        ? 'One or more categories are inactive or do not belong to the user'
        : 'One or more categories do not belong to the authenticated user',
    });
  }
}

export async function assertUserCategoryBelongsToUser(
  userId: string,
  categoryId: string,
  options: { activeOnly?: boolean } = {},
): Promise<void> {
  await assertCategoriesBelongToUser(userId, [categoryId], options);
}
