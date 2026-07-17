import type { FinancialSpace } from '../../shared/schemas/financialSpaces.js';
import type { Binary, Document, ObjectId } from 'mongodb';

import BaseSecureUserScopedRepo, { type UpdateUserScopedRecord } from './BaseSecureUserScopedRepo.js';

type FinancialSpaceDbDocument = Omit<
  FinancialSpace,
  '_id' | 'userId' | 'name' | 'description' | 'categoryIds'
> & {
  _id?: ObjectId;
  categoryIds: ObjectId[];
  description?: Binary;
  name: Binary;
  userId: ObjectId;
} & Document;

class FinancialSpacesRepo extends BaseSecureUserScopedRepo<
  FinancialSpace,
  FinancialSpaceDbDocument
> {
  constructor(userId: string | ObjectId) {
    super('financial_spaces', userId);
  }

  override async mapDocument(
    record: Omit<FinancialSpace, '_id'>,
  ): Promise<FinancialSpaceDbDocument> {
    const data: FinancialSpaceDbDocument = {
      userId: this.userObjectId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt ?? null,
      name: await this.encryptRandom(record.name),
      categoryMode: record.categoryMode,
      categoryIds: record.categoryIds.map((categoryId) => this.toObjectId(categoryId)),
      showOnDashboard: record.showOnDashboard,
    };

    if (record.description !== undefined)
      data.description = await this.encryptRandom(record.description);
    if (record.icon !== undefined) data.icon = record.icon;
    if (record.color !== undefined) data.color = record.color;
    if (record.currencies !== undefined) data.currencies = record.currencies;

    return data;
  }

  override async mapUpdateDocument(
    record: UpdateUserScopedRecord<FinancialSpace>,
  ): Promise<Partial<FinancialSpaceDbDocument>> {
    const data: Partial<FinancialSpaceDbDocument> = {};

    if (record.name !== undefined) data.name = await this.encryptRandom(record.name);
    if (record.description !== undefined)
      data.description = await this.encryptRandom(record.description);
    if (record.icon !== undefined) data.icon = record.icon;
    if (record.color !== undefined) data.color = record.color;
    if (record.categoryMode !== undefined) data.categoryMode = record.categoryMode;
    if (record.categoryIds !== undefined) {
      data.categoryIds = record.categoryIds.map((categoryId) => this.toObjectId(categoryId));
    }
    if (record.currencies !== undefined) data.currencies = record.currencies;
    if (record.showOnDashboard !== undefined) data.showOnDashboard = record.showOnDashboard;

    return data;
  }
}

export { FinancialSpacesRepo };
export default FinancialSpacesRepo;
