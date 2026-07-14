import { ObjectId } from 'mongodb';

export async function assertFinancialSpaceCategoriesBelongToUser(
  userId: string,
  categoryIds: string[],
): Promise<void> {
  if (categoryIds.length === 0) return;

  const { db } = await useSecureClient();
  const categories = db.collection('categories');
  const existingCategories = await categories.countDocuments({
    _id: { $in: categoryIds.map(categoryId => ObjectId.createFromHexString(categoryId)) },
    userId: ObjectId.createFromHexString(userId),
  });

  if (existingCategories !== categoryIds.length) {
    throw createError({
      statusCode: 422,
      message: 'One or more categories do not belong to the authenticated user',
    });
  }
}
