import { MongoServerError, ObjectId } from 'mongodb';

import type {
  Document,
  Filter,
  OptionalUnlessRequiredId,
  UpdateResult,
  WithId,
} from 'mongodb';
import type { UserCreate, UserUpdate } from '~~/shared/schemas/users';
import type { User } from '~~/shared/types/user';

import BaseSecureRepo from './BaseSecureRepo.js';

type UserDocument = Omit<User, '_id'> & {
  _id?: ObjectId
  initialPinHash?: string
} & Document;

export type UserRecord = WithId<UserDocument>;

type UserInsert = Omit<UserCreate, 'initialPin'> & {
  initialPinHash: string
};

class UsersRepo extends BaseSecureRepo<
  UserRecord,
  UserDocument,
  UserInsert,
  UserUpdate,
  string | ObjectId
> {
  constructor() {
    super('users');
  }

  async clearInitialPin(id: string | ObjectId): Promise<void> {
    const collection = await this.getCollection();
    await collection.updateOne(
      this.getRecordFilter(id),
      { $unset: { initialPinHash: '' }, $set: { updatedAt: new Date() } },
    );
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const collection = await this.getCollection();
    return this.normalizeUser(
      await collection.findOne({ email: email.trim().toLowerCase() }),
    );
  }

  override async getRecordById(
    id: string | ObjectId,
  ): Promise<UserRecord | null> {
    return this.normalizeUser(await super.getRecordById(id));
  }

  override async insertRecord(record: UserInsert): Promise<ObjectId | null> {
    if (await this.findByEmail(record.email)) {
      throw new Error('User email already exists');
    }

    try {
      return await super.insertRecord(record);
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        throw new Error('User already exists', { cause: error });
      }
      throw error;
    }
  }

  async setActive(
    id: string | ObjectId,
    active: boolean,
  ): Promise<UpdateResult<UserDocument>> {
    const collection = await this.getCollection();
    return collection.updateOne(
      this.getRecordFilter(id),
      { $set: { active, updatedAt: new Date() } },
    );
  }

  async updateLastAccess(id: string | ObjectId, date: Date): Promise<void> {
    const collection = await this.getCollection();
    await collection.updateOne(
      this.getRecordFilter(id),
      { $set: { lastAccessAt: date, updatedAt: date } },
    );
  }

  protected override getRecordFilter(
    id: string | ObjectId,
  ): Filter<UserDocument> {
    return { _id: this.toObjectId(id) };
  }

  protected override mapDocument(
    record: UserInsert,
  ): Promise<OptionalUnlessRequiredId<UserDocument>> {
    return Promise.resolve({
      email: record.email.trim().toLowerCase(),
      name: record.name.trim(),
      active: true,
      initialPinHash: record.initialPinHash,
      lastAccessAt: null,
      createdAt: new Date(),
      updatedAt: null,
    });
  }

  protected override mapUpdateDocument(
    changes: UserUpdate,
  ): Promise<Partial<UserDocument>> {
    return Promise.resolve({
      ...changes,
      ...(changes.name === undefined ? {} : { name: changes.name.trim() }),
      updatedAt: new Date(),
    });
  }

  private normalizeUser(user: UserRecord | null): UserRecord | null {
    if (!user) return null;

    return {
      ...user,
      name: user.name ?? user.email.split('@')[0],
      lastAccessAt: user.lastAccessAt ?? null,
      updatedAt: user.updatedAt ?? null,
    };
  }

  private toObjectId(id: string | ObjectId): ObjectId {
    return id instanceof ObjectId ? id : ObjectId.createFromHexString(id);
  }
}

export { UsersRepo };
export default UsersRepo;
