import { MongoServerError } from 'mongodb';
import { createError } from 'h3';

import type {
  CategoryKind,
  UserCategory,
  UserCategoryCreate,
  UserCategoryUpdate,
} from '../../shared/schemas/categories.js';
import type { Binary, Document, ObjectId } from 'mongodb';

import BaseSecureUserScopedRepo, {
  type UpdateUserScopedRecord,
} from './BaseSecureUserScopedRepo.js';
import { normalizeCategoryName } from '../../shared/utils/categories.js';

type UserCategoryDbDocument = Omit<
  UserCategory,
  '_id' | 'catalogCategoryId' | 'name' | 'parentId' | 'userId'
> & {
  _id?: ObjectId
  catalogCategoryId: ObjectId | null
  name: Binary | null
  nameNormalized: Binary | null
  parentId: ObjectId | null
  userId: ObjectId
} & Document;

class UserCategoriesRepo extends BaseSecureUserScopedRepo<
  UserCategory,
  UserCategoryDbDocument
> {
  constructor(userId: string | ObjectId) {
    super('user_categories', userId);
  }

  async findByCatalogCategoryId(
    catalogCategoryId: string | ObjectId,
  ): Promise<UserCategory | null> {
    const records = await this.getRecords({
      catalogCategoryId: this.toObjectId(catalogCategoryId),
    });

    return records[0] ?? null;
  }

  async findCustomByName(
    name: string,
    parentId: string | null,
    kind: CategoryKind,
    excludeId?: string,
  ): Promise<UserCategory | null> {
    const normalizedName = await this.encryptDeterministic(
      normalizeCategoryName(name),
    );
    const records = await this.getRecords({
      catalogCategoryId: null,
      kind,
      nameNormalized: normalizedName,
      parentId: parentId ? this.toObjectId(parentId) : null,
      ...(excludeId ? { _id: { $ne: this.toObjectId(excludeId) } } : {}),
    });

    return records[0] ?? null;
  }

  async getConfiguredCategories(): Promise<UserCategory[]> {
    return this.getRecords(
      {},
      {
        projection: { nameNormalized: 0 },
        sort: { level: 1, createdAt: 1 },
      },
    );
  }

  override async mapUserDocument(
    record: Omit<UserCategory, '_id'>,
  ): Promise<UserCategoryDbDocument> {
    const normalizedName = record.name
      ? normalizeCategoryName(record.name)
      : null;

    return {
      userId: this.userObjectId,
      catalogCategoryId: record.catalogCategoryId
        ? this.toObjectId(record.catalogCategoryId)
        : null,
      parentId: record.parentId ? this.toObjectId(record.parentId) : null,
      name: record.name ? await this.encryptRandom(record.name) : null,
      nameNormalized: normalizedName
        ? await this.encryptDeterministic(normalizedName)
        : null,
      active: record.active,
      color: record.color,
      kind: record.kind,
      level: record.level,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt ?? null,
    };
  }

  override async mapUserUpdateDocument(
    record: UpdateUserScopedRecord<UserCategory>,
  ): Promise<Partial<UserCategoryDbDocument>> {
    const data: Partial<UserCategoryDbDocument> = {};

    if (record.name !== undefined) {
      data.name = record.name ? await this.encryptRandom(record.name) : null;
      data.nameNormalized = record.name
        ? await this.encryptDeterministic(normalizeCategoryName(record.name))
        : null;
    }

    if (record.active !== undefined) data.active = record.active;
    if (record.color !== undefined) data.color = record.color;
    return data;
  }

  protected override interceptError(error: unknown): unknown {
    if (error instanceof MongoServerError && error.code === 11000) {
      return createError({
        statusCode: 409,
        message: 'A category with this name or catalog source already exists',
      });
    }

    return super.interceptError(error);
  }
}

export type { UserCategoryCreate, UserCategoryUpdate };
export { UserCategoriesRepo };
export default UserCategoriesRepo;
