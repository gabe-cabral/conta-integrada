import type {
  Binary,
  Document,
  ObjectId,
  UpdateFilter,
  UpdateResult,
} from 'mongodb';
import type {
  CostCenter,
  CostCenterUpdate,
} from '../../shared/schemas/costCenters.js';

import BaseSecureUserScopedRepo from './BaseSecureUserScopedRepo.js';

type CostCenterDbDocument = Omit<
  CostCenter,
  '_id' | 'userId' | 'name' | 'description' | 'limit' | 'categoryIds'
> & {
  _id?: ObjectId
  categoryIds: ObjectId[]
  description?: Binary
  limit?: Binary
  name: Binary
  userId: ObjectId
} & Document;

class CostCentersRepo extends BaseSecureUserScopedRepo<
  CostCenter,
  CostCenterDbDocument
> {
  constructor(userId: string | ObjectId) {
    super('cost_centers', userId);
  }

  override async mapUserDocument(
    record: Omit<CostCenter, '_id'>,
  ): Promise<CostCenterDbDocument> {
    const data: CostCenterDbDocument = {
      userId: this.userObjectId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt ?? null,
      name: await this.encryptRandom(record.name),
      categoryIds: record.categoryIds.map((categoryId) =>
        this.toObjectId(categoryId)),
      active: record.active,
    };

    if (record.description !== undefined)
      data.description = await this.encryptRandom(record.description);
    if (record.limit !== undefined)
      data.limit = await this.encryptRandom(record.limit);

    return data;
  }

  override async mapUserUpdateDocument(
    record: Partial<Omit<CostCenter, '_id' | 'userId' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Partial<CostCenterDbDocument>> {
    const data: Partial<CostCenterDbDocument> = {};

    if (record.name !== undefined)
      data.name = await this.encryptRandom(record.name);
    if (record.description !== undefined)
      data.description = await this.encryptRandom(record.description);
    if (record.limit !== undefined)
      data.limit = await this.encryptRandom(record.limit);
    if (record.categoryIds !== undefined) {
      data.categoryIds = record.categoryIds.map((categoryId) =>
        this.toObjectId(categoryId));
    }
    if (record.active !== undefined) data.active = record.active;

    return data;
  }

  async updateCostCenter(
    recordId: string | ObjectId,
    changes: CostCenterUpdate,
  ): Promise<UpdateResult<CostCenterDbDocument>> {
    const collection = await this.getCollection();
    const { limit, ...fields } = changes;
    const data = await this.mapUserUpdateDocument(fields);
    const encryptedLimit = limit && await this.encryptRandom(limit);
    const update: UpdateFilter<CostCenterDbDocument> = {
      $set: {
        ...data,
        ...(encryptedLimit ? { limit: encryptedLimit } : {}),
        updatedAt: new Date(),
      },
      ...(limit === null ? { $unset: { limit: '' } } : {}),
    };

    return collection.updateOne(this.getRecordFilter(recordId), update);
  }
}

export { CostCentersRepo };
export default CostCentersRepo;
