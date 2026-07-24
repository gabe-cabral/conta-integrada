import {
  customUserCategoryCreateSchema,
  userCategoryAdoptSchema,
  userCategoryCreateSchema,
} from '~~/shared/schemas/categories';
import { assertCustomNameDoesNotMatchCatalog } from '~~/server/utils/categoryHierarchy';
import { assertUserCategoryBelongsToUser } from '~~/server/utils/categories';
import UserCategoriesRepo from '~~/server/repositories/UserCategoriesRepo';
import CategoriesRepo from '~~/server/repositories/CategoriesRepo';
import { zodObjectId } from '~~/shared/zod/mongodb';
import { z } from 'zod';

const routeSchema = z.strictObject({ userId: zodObjectId });

export default defineEventHandler(async (event) => {
  const { userId } = await getValidatedRouterParams(event, routeSchema.parse);
  const { user } = await requireUserSession(event);
  if (user.id !== userId) throw createError({ statusCode: 403, message: 'Forbidden' });

  const rawBody = await readBody(event);
  const repository = new UserCategoriesRepo(userId);
  const record = await buildCreateRecord(userId, rawBody, repository);
  const id = await repository.insertRecord(userCategoryCreateSchema.parse(record));

  if (!id) throw createError({ statusCode: 500, message: 'Failed to create category' });
  const category = await repository.getRecordById(id);
  setResponseStatus(event, 201);
  return category;
});

async function buildCreateRecord(
  userId: string,
  rawBody: unknown,
  repository: UserCategoriesRepo,
) {
  if (
    typeof rawBody === 'object'
    && rawBody !== null
    && 'catalogCategoryId' in rawBody
  ) {
    const adoption = userCategoryAdoptSchema.parse(rawBody);
    const catalogCategory = await new CategoriesRepo()
      .getRecordById(adoption.catalogCategoryId);

    if (!catalogCategory || !catalogCategory.active) {
      throw createError({ statusCode: 404, message: 'Catalog category not found' });
    }

    let parentId: string | null = null;
    if (catalogCategory.parentId) {
      const parent = await repository.findByCatalogCategoryId(
        catalogCategory.parentId.toString(),
      );

      if (!parent || !parent.active) {
        throw createError({
          statusCode: 422,
          message: 'Activate the parent category before adopting an activity',
        });
      }

      parentId = parent._id.toString();
    }

    for (const name of Object.values(catalogCategory.name)) {
      if (
        await repository.findCustomByName(
          name,
          parentId,
          catalogCategory.kind,
        )
      ) {
        throw createError({
          statusCode: 409,
          message: 'A custom category with this name already exists',
        });
      }
    }

    return {
      catalogCategoryId: catalogCategory._id.toString(),
      parentId,
      name: null,
      active: adoption.active,
      color: catalogCategory.color,
      kind: catalogCategory.kind,
      level: catalogCategory.level,
    };
  }

  const customCategory = customUserCategoryCreateSchema.parse(rawBody);
  let parent = null;
  if (customCategory.parentId) {
    await assertUserCategoryBelongsToUser(
      userId,
      customCategory.parentId,
      { activeOnly: true },
    );
    parent = await repository.getRecordById(customCategory.parentId);

    if (
      !parent
      || parent.level !== 'CATEGORY'
      || parent.kind !== customCategory.kind
    ) {
      throw createError({
        statusCode: 422,
        message: 'The activity parent must be a category of the same kind',
      });
    }
  }

  await assertCustomNameDoesNotMatchCatalog(
    customCategory,
    customCategory.name,
    parent,
  );

  return { ...customCategory, catalogCategoryId: null };
}
