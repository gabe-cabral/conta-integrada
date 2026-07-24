import { MongoServerError, ObjectId } from 'mongodb';
import { createError } from 'h3';

import type {
  Category,
  CategoryCreate,
  CategoryUpdate,
} from '../../shared/schemas/categories.js';
import type {
  Document,
  Filter,
  OptionalUnlessRequiredId,
  UpdateResult,
} from 'mongodb';

import BaseSecureRepo from './BaseSecureRepo.js';

type CategoryDbDocument = Omit<Category, '_id' | 'parentId'> & {
  _id: ObjectId
  parentId: ObjectId | null
} & Document;

class CategoriesRepo extends BaseSecureRepo<
  Category,
  CategoryDbDocument,
  CategoryCreate,
  CategoryUpdate,
  string | ObjectId
> {
  constructor() {
    super('categories');
  }

  async listCategories(active?: boolean): Promise<Category[]> {
    const filter = active === undefined ? {} : { active };
    return this.getRecords(filter, { sort: { 'level': 1, 'name.en': 1 } });
  }

  async updateCategory(
    id: string | ObjectId,
    changes: CategoryUpdate,
  ): Promise<UpdateResult<CategoryDbDocument>> {
    return this.updateRecord(id, changes);
  }

  protected override getRecordFilter(
    recordId: string | ObjectId,
  ): Filter<CategoryDbDocument> {
    return { _id: this.toObjectId(recordId) };
  }

  protected override interceptError(error: unknown): unknown {
    if (error instanceof MongoServerError && error.code === 11000) {
      return createError({
        statusCode: 409,
        message: 'A catalog category with this name already exists',
      });
    }

    return super.interceptError(error);
  }

  protected override async mapDocument(
    record: CategoryCreate,
  ): Promise<OptionalUnlessRequiredId<CategoryDbDocument>> {
    return {
      ...record,
      _id: record._id ? this.toObjectId(record._id) : new ObjectId(),
      parentId: record.parentId ? this.toObjectId(record.parentId) : null,
    };
  }

  protected override async mapUpdateDocument(
    record: CategoryUpdate,
  ): Promise<Partial<CategoryDbDocument>> {
    const { parentId, ...changes } = record;

    return {
      ...changes,
      ...(parentId !== undefined
        ? {
            parentId: parentId
              ? this.toObjectId(parentId)
              : null,
          }
        : {}),
    };
  }

  private toObjectId(id: string | ObjectId): ObjectId {
    if (id instanceof ObjectId) return id;
    return ObjectId.createFromHexString(id);
  }
}

export { CategoriesRepo };
export default CategoriesRepo;
