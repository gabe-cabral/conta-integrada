import {
  costCenterCreateSchema,
  costCenterUpdateSchema,
} from '~~/shared/schemas/costCenters';
import { assertCostCenterCategoriesBelongToUser } from '~~/server/utils/costCenters';
import CostCentersRepo from '~~/server/repositories/CostCentersRepo';
import { zodObjectId } from '~~/shared/zod/mongodb';
import { z } from 'zod';

const routeSchema = z.strictObject({
  userId: zodObjectId,
  costCenterId: zodObjectId,
});

export default defineEventHandler(async (event) => {
  const { userId, costCenterId } = await getValidatedRouterParams(event, routeSchema.parse);
  const { user } = await requireUserSession(event);

  if (user.id !== userId) throw createError({ statusCode: 403, message: 'Forbidden' });

  const changes = await readValidatedBody(event, costCenterUpdateSchema.parse);
  const repository = new CostCentersRepo(userId);
  const current = await repository.getRecordById(costCenterId);

  if (!current) throw createError({ statusCode: 404, message: 'Cost center not found' });

  const nextCostCenter = costCenterCreateSchema.parse({
    name: changes.name ?? current.name,
    description: changes.description ?? current.description,
    limit: changes.limit === null ? undefined : (changes.limit ?? current.limit),
    categoryIds: changes.categoryIds ?? current.categoryIds.map((categoryId) =>
      categoryId.toString()),
    active: changes.active ?? current.active,
  });

  await assertCostCenterCategoriesBelongToUser(userId, nextCostCenter.categoryIds);

  const result = await repository.updateCostCenter(costCenterId, {
    ...nextCostCenter,
    limit: changes.limit === null ? null : nextCostCenter.limit,
  });

  if (result.matchedCount === 0)
    throw createError({ statusCode: 404, message: 'Cost center not found' });

  return repository.getRecordById(costCenterId);
});
