import { ObjectId } from 'mongodb';

import type {
  Category,
  CategoryCreate,
  UserCategory,
} from '../../shared/schemas/categories.js';

import { normalizeCategoryName } from '../../shared/utils/categories.js';
import CategoriesRepo from '../repositories/CategoriesRepo.js';

export async function assertCatalogCategoryHierarchy(
  category: Pick<CategoryCreate, 'kind' | 'level' | 'parentId'>,
  ownId?: string,
): Promise<void> {
  if (category.level === 'CATEGORY') return;
  if (!category.parentId || category.parentId === ownId) {
    throw createError({ statusCode: 422, message: 'Invalid parent category' });
  }

  const parent = await new CategoriesRepo().getRecordById(category.parentId);
  if (!parent || parent.level !== 'CATEGORY' || parent.kind !== category.kind) {
    throw createError({
      statusCode: 422,
      message: 'The activity parent must be a category of the same kind',
    });
  }
}

export function mergeCatalogCategory(
  current: Category,
  changes: Partial<Category>,
): Category {
  return {
    ...current,
    ...changes,
    _id: current._id.toString(),
    parentId: changes.parentId === undefined
      ? current.parentId?.toString() ?? null
      : changes.parentId,
  };
}

export async function assertCustomNameDoesNotMatchCatalog(
  category: Pick<UserCategory, 'kind' | 'level' | 'parentId'>,
  name: string,
  parent?: UserCategory | null,
): Promise<void> {
  let catalogParentId: string | null = null;
  if (category.level === 'ACTIVITY') {
    if (!parent?.catalogCategoryId) return;
    catalogParentId = parent.catalogCategoryId.toString();
  }

  const catalogCategories = await new CategoriesRepo().getRecords({
    kind: category.kind,
    level: category.level,
    parentId: catalogParentId
      ? ObjectId.createFromHexString(catalogParentId)
      : null,
  });
  const normalizedName = normalizeCategoryName(name);
  const hasDuplicate = catalogCategories.some((catalogCategory) =>
    Object.values(catalogCategory.name).some(
      (localizedName) => normalizeCategoryName(localizedName) === normalizedName,
    ));

  if (hasDuplicate) {
    throw createError({
      statusCode: 409,
      message: 'A catalog category with this name already exists',
    });
  }
}
