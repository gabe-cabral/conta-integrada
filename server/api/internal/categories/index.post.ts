import { assertCatalogCategoryHierarchy } from '~~/server/utils/categoryHierarchy';
import { categoryCreateSchema } from '~~/shared/schemas/categories';
import CategoriesRepo from '~~/server/repositories/CategoriesRepo';

export default defineEventHandler(async (event) => {
  requireInternalApiAccess(event);
  const body = await readValidatedBody(event, categoryCreateSchema.parse);
  await assertCatalogCategoryHierarchy(body);

  const repository = new CategoriesRepo();
  const id = await repository.insertRecord(body);
  if (!id) throw createError({ statusCode: 500, message: 'Failed to create category' });

  const category = await repository.getRecordById(id);
  setResponseStatus(event, 201);
  return category;
});
