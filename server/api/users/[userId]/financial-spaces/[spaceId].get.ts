import { z } from 'zod';
import FinancialSpacesRepo from '~~/server/repositories/FinancialSpacesRepo';
import { zodObjectId } from '~~/shared/zod/mongodb';

const routeSchema = z.strictObject({
  userId: zodObjectId,
  spaceId: zodObjectId,
});

export default defineEventHandler(async (event) => {
  const { userId, spaceId } = await getValidatedRouterParams(event, routeSchema.parse);
  const { user } = await requireUserSession(event);

  if (user.id !== userId) throw createError({ statusCode: 403, message: 'Forbidden' });

  const financialSpace = await new FinancialSpacesRepo(userId).getRecordById(spaceId);
  if (!financialSpace) throw createError({ statusCode: 404, message: 'Financial space not found' });

  return financialSpace;
});
