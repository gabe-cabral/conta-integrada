import { financialSpaceCreateSchema, financialSpaceUpdateSchema } from '~~/shared/schemas/financialSpaces';
import { assertFinancialSpaceCategoriesBelongToUser } from '~~/server/utils/financialSpaces';
import FinancialSpacesRepo from '~~/server/repositories/FinancialSpacesRepo';
import { zodObjectId } from '~~/shared/zod/mongodb';
import { z } from 'zod';

const routeSchema = z.strictObject({
  userId: zodObjectId,
  spaceId: zodObjectId,
});

export default defineEventHandler(async (event) => {
  const { userId, spaceId } = await getValidatedRouterParams(event, routeSchema.parse);
  const { user } = await requireUserSession(event);

  if (user.id !== userId) throw createError({ statusCode: 403, message: 'Forbidden' });

  const changes = await readValidatedBody(event, financialSpaceUpdateSchema.parse);
  const repository = new FinancialSpacesRepo(userId);
  const current = await repository.getRecordById(spaceId);

  if (!current) throw createError({ statusCode: 404, message: 'Financial space not found' });

  const currentCategoryIds = current.categoryIds.map(categoryId => categoryId.toString());
  const categoryIds = changes.categoryMode === 'all'
    ? []
    : changes.categoryIds ?? currentCategoryIds;

  const nextFinancialSpace = financialSpaceCreateSchema.parse({
    name: changes.name ?? current.name,
    description: changes.description ?? current.description,
    icon: changes.icon ?? current.icon,
    color: changes.color ?? current.color,
    categoryMode: changes.categoryMode ?? current.categoryMode,
    categoryIds,
    currencies: changes.currencies ?? current.currencies,
    showOnDashboard: changes.showOnDashboard ?? current.showOnDashboard,
  });

  await assertFinancialSpaceCategoriesBelongToUser(userId, nextFinancialSpace.categoryIds);

  const result = await repository.updateRecord(spaceId, nextFinancialSpace);
  if (result.matchedCount === 0) throw createError({ statusCode: 404, message: 'Financial space not found' });

  return repository.getRecordById(spaceId);
});
