import FinancialSpacesRepo from '~~/server/repositories/FinancialSpacesRepo';
import { zodObjectId } from '~~/shared/zod/mongodb';
import { z } from 'zod';

const routeSchema = z.strictObject({ userId: zodObjectId });

export default defineEventHandler(async (event) => {
  const { userId } = await getValidatedRouterParams(event, routeSchema.parse);
  const { user } = await requireUserSession(event);

  if (user.id !== userId) throw createError({ statusCode: 403, message: 'Forbidden' });

  return new FinancialSpacesRepo(userId).getUserRecords({}, { sort: { createdAt: 1 } });
});
