import {
  assertCatalogCategoryHierarchy,
  mergeCatalogCategory,
} from '~~/server/utils/categoryHierarchy';
import {
  categorySchema,
  categoryUpdateSchema,
} from '~~/shared/schemas/categories';
import CategoriesRepo from '~~/server/repositories/CategoriesRepo';
import { zodObjectId } from '~~/shared/zod/mongodb';
import { z } from 'zod';

const routeSchema = z.strictObject({ categoryId: zodObjectId });

export default defineEventHandler(async (event) => {
  requireInternalApiAccess(event);
  const { categoryId } = await getValidatedRouterParams(event, routeSchema.parse);
  const changes = await readValidatedBody(event, categoryUpdateSchema.parse);
  const repository = new CategoriesRepo();
  const current = await repository.getRecordById(categoryId);

  if (!current) throw createError({ statusCode: 404, message: 'Category not found' });

  const nextCategory = categorySchema.parse(mergeCatalogCategory(current, changes));
  await assertCatalogCategoryHierarchy(nextCategory, categoryId);
  const result = await repository.updateCategory(categoryId, changes);

  if (result.matchedCount === 0)
    throw createError({ statusCode: 404, message: 'Category not found' });

  return repository.getRecordById(categoryId);
});
