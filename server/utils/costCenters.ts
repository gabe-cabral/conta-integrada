import CostCentersRepo from '../repositories/CostCentersRepo.js';
import { assertCategoriesBelongToUser } from './categories.js';

export async function assertCostCenterCategoriesBelongToUser(
  userId: string,
  categoryIds: string[],
): Promise<void> {
  await assertCategoriesBelongToUser(userId, categoryIds);
}

export async function assertCostCenterBelongsToUser(
  userId: string,
  costCenterId: string,
  options: { activeOnly?: boolean } = {},
): Promise<void> {
  const costCenter = await new CostCentersRepo(userId).getRecordById(costCenterId);

  if (!costCenter || (options.activeOnly && !costCenter.active)) {
    throw createError({
      statusCode: 422,
      message: options.activeOnly
        ? 'Cost center is inactive or does not belong to the authenticated user'
        : 'Cost center does not belong to the authenticated user',
    });
  }
}
