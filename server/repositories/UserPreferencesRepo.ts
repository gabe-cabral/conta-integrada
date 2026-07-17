import { type Document, ObjectId, type UpdateResult } from 'mongodb';

import type {
  UserPreference,
  UserPreferenceUpdate,
} from '~~/shared/schemas/userPreferences';
import BaseSecureUserScopedRepo, {
  type CreateUserScopedRecord,
  type UpdateUserScopedRecord,
} from './BaseSecureUserScopedRepo.js';

type UserPreferenceDocument = Omit<UserPreference, '_id' | 'userId'> & {
  _id?: ObjectId;
  userId: ObjectId;
} & Document;

class UserPreferencesRepo extends BaseSecureUserScopedRepo<
  UserPreference,
  UserPreferenceDocument
> {
  constructor(userId: string | ObjectId) {
    super('user_preferences', userId);
  }

  override async deleteRecord(_recordId: string | ObjectId): Promise<never> {
    throw new Error('Not implemented: user preferences cannot be deleted');
  }

  async getByUserId(): Promise<UserPreference | null> {
    const [preference] = await this.getUserRecords({}, { limit: 1 });
    return preference ?? null;
  }

  override async getRecordById(_recordId: string | ObjectId): Promise<never> {
    throw new Error(
      'Not implemented: user preferences are retrieved by user ID',
    );
  }

  override async insertManyRecords(
    _records: CreateUserScopedRecord<UserPreference>[],
  ): Promise<never> {
    throw new Error(
      'Not implemented: user preferences cannot be inserted in bulk',
    );
  }

  override async insertRecord(
    _record: CreateUserScopedRecord<UserPreference>,
  ): Promise<never> {
    throw new Error(
      'Not implemented: user preferences are created with the user',
    );
  }

  async updateByUserId(
    changes: UserPreferenceUpdate,
  ): Promise<UpdateResult<UserPreferenceDocument>> {
    const collection = await this.getCollection();
    return collection.updateOne(
      { userId: this.userObjectId },
      { $set: { ...changes, updatedAt: new Date() } },
    );
  }

  override async updateRecord(
    _recordId: string | ObjectId,
    _changes: UpdateUserScopedRecord<UserPreference>,
  ): Promise<never> {
    throw new Error('Not implemented: user preferences are updated by user ID');
  }
}

export { UserPreferencesRepo };
export default UserPreferencesRepo;
