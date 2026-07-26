import { assertCostCenterCategoriesBelongToUser } from '~~/server/utils/costCenters';
import { costCenterCreateSchema } from '~~/shared/schemas/costCenters';
import CostCentersRepo from '~~/server/repositories/CostCentersRepo';
import { zodObjectId } from '~~/shared/zod/mongodb';
import { z } from 'zod';

const routeSchema = z.strictObject({ userId: zodObjectId });

export default defineEventHandler(async (event) => {
  const { userId } = await getValidatedRouterParams(event, routeSchema.parse);
  const { user } = await requireUserSession(event);

  if (user.id !== userId) throw createError({ statusCode: 403, message: 'Forbidden' });

  const body = await readValidatedBody(event, costCenterCreateSchema.parse);
  await assertCostCenterCategoriesBelongToUser(userId, body.categoryIds);

  const repository = new CostCentersRepo(userId);
  const id = await repository.insertRecord(body);

  if (!id) throw createError({ statusCode: 500, message: 'Failed to create cost center' });

  const costCenter = await repository.getRecordById(id);
  if (!costCenter)
    throw createError({ statusCode: 500, message: 'Failed to load created cost center' });

  setResponseStatus(event, 201);
  return costCenter;
});
