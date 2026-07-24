import { assertCategoriesBelongToUser } from './categories.js';

export async function assertFinancialSpaceCategoriesBelongToUser(
  userId: string,
  categoryIds: string[],
): Promise<void> {
  await assertCategoriesBelongToUser(userId, categoryIds);
}
