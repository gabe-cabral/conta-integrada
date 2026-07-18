import assert from 'node:assert';

import { ObjectId } from 'mongodb';

import type {
  Document,
  Filter,
  FindOptions,
  OptionalUnlessRequiredId,
} from 'mongodb';
import type { UserAuditableRecord } from '../../shared/zod/zodBase.js';

import { getKeyAltName } from '../utils/key-alt-name.js';
import BaseSecureRepo from './BaseSecureRepo.js';

type UserScopedModel = UserAuditableRecord & {
  _id?: unknown
};

export type CreateUserScopedRecord<TModel extends UserScopedModel> = Omit<
  TModel,
  '_id' | 'userId' | 'createdAt' | 'updatedAt'
>;

export type UpdateUserScopedRecord<TModel extends UserScopedModel> = Partial<
  CreateUserScopedRecord<TModel>
>;

type CreateRecordWithAudit<TModel extends UserScopedModel> = Omit<
  TModel,
  '_id'
>;

class BaseSecureUserScopedRepo<
  TModel extends UserScopedModel,
  TDocument extends Document,
> extends BaseSecureRepo<
    TModel,
    TDocument,
    CreateUserScopedRecord<TModel>,
    UpdateUserScopedRecord<TModel>,
  string | ObjectId
  > {
  readonly #userId: ObjectId;

  constructor(collectionName: string, userId: string | ObjectId) {
    super(collectionName);

    assert(
      (typeof userId === 'string' && userId.length === 24)
      || userId instanceof ObjectId,
      'User ID must be a 24-character string or an ObjectId',
    );
    assert(
      userId instanceof ObjectId || ObjectId.isValid(userId),
      'User ID must be a valid ObjectId',
    );

    this.#userId
      = userId instanceof ObjectId
        ? userId
        : ObjectId.createFromHexString(userId);
  }

  override async getRecords(
    filter: Filter<TDocument> = {},
    options?: FindOptions,
  ): Promise<TModel[]> {
    return super.getRecords(
      {
        $and: [{ userId: this.#userId }, filter],
      } as Filter<TDocument>,
      options,
    );
  }

  async getUserRecords(
    filter: Filter<TDocument> = {},
    options?: FindOptions,
  ): Promise<TModel[]> {
    return this.getRecords(filter, options);
  }

  protected get userId(): string {
    return this.#userId.toHexString();
  }

  protected get userObjectId(): ObjectId {
    return this.#userId;
  }

  protected buildCreateRecord(
    record: CreateUserScopedRecord<TModel>,
  ): CreateRecordWithAudit<TModel> {
    return {
      ...record,
      userId: this.userId,
      createdAt: new Date(),
      updatedAt: null,
    } as CreateRecordWithAudit<TModel>;
  }

  protected override getEncryptionKeyAltName(): string {
    return getKeyAltName(this.userId);
  }

  protected override getRecordFilter(
    recordId: string | ObjectId,
  ): Filter<TDocument> {
    return {
      $and: [{ _id: this.toObjectId(recordId) }, { userId: this.#userId }],
    } as Filter<TDocument>;
  }

  protected override mapDocument(
    record: CreateUserScopedRecord<TModel>,
  ): Promise<OptionalUnlessRequiredId<TDocument>> {
    return this.mapUserDocument(this.buildCreateRecord(record));
  }

  protected override async mapUpdateDocument(
    record: UpdateUserScopedRecord<TModel>,
  ): Promise<Partial<TDocument>> {
    return {
      ...(await this.mapUserUpdateDocument(record)),
      updatedAt: new Date(),
    } as Partial<TDocument>;
  }

  protected async mapUserDocument(
    _record: CreateRecordWithAudit<TModel>,
  ): Promise<OptionalUnlessRequiredId<TDocument>> {
    throw new Error('mapUserDocument must be implemented by subclass');
  }

  protected async mapUserUpdateDocument(
    record: UpdateUserScopedRecord<TModel>,
  ): Promise<Partial<TDocument>> {
    return record as Partial<TDocument>;
  }

  protected toObjectId(id: string | ObjectId): ObjectId {
    assert(
      id instanceof ObjectId || ObjectId.isValid(id),
      'ID must be a valid ObjectId',
    );
    return id instanceof ObjectId ? id : ObjectId.createFromHexString(id);
  }
}

export { BaseSecureUserScopedRepo };
export default BaseSecureUserScopedRepo;
