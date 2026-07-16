import { assertFinancialSpaceCategoriesBelongToUser } from '~~/server/utils/financialSpaces';
import { financialSpaceCreateSchema } from '~~/shared/schemas/financialSpaces';
import FinancialSpacesRepo from '~~/server/repositories/FinancialSpacesRepo';
import { zodObjectId } from '~~/shared/zod/mongodb';
import { z } from 'zod';

const routeSchema = z.strictObject({ userId: zodObjectId });

export default defineEventHandler(async (event) => {
  const { userId } = await getValidatedRouterParams(event, routeSchema.parse);
  const { user } = await requireUserSession(event);

  if (user.id !== userId) throw createError({ statusCode: 403, message: 'Forbidden' });

  const body = await readValidatedBody(event, financialSpaceCreateSchema.parse);
  await assertFinancialSpaceCategoriesBelongToUser(userId, body.categoryIds);

  const repository = new FinancialSpacesRepo(userId);
  const id = await repository.insertRecord(body);

  if (!id) throw createError({ statusCode: 500, message: 'Failed to create financial space' });

  const financialSpace = await repository.getRecordById(id);
  if (!financialSpace) throw createError({ statusCode: 500, message: 'Failed to load created financial space' });

  setResponseStatus(event, 201);
  return financialSpace;
});
