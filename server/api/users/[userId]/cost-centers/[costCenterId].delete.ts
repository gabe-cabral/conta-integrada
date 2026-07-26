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

  const result = await new CostCentersRepo(userId).deleteRecord(costCenterId);
  if (result.deletedCount === 0)
    throw createError({ statusCode: 404, message: 'Cost center not found' });

  setResponseStatus(event, 204);
  return null;
});
