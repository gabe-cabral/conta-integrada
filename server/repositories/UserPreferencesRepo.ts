import { type Collection, ObjectId, type UpdateResult } from 'mongodb';
import { useDatabase } from '~~/server/utils/mongo';

import type { UserPreference, UserPreferenceUpdate } from '~~/shared/schemas/userPreferences';

class UserPreferencesRepo {
  readonly #collectionName = 'user_preferences';

  async getByUserId(userId: string): Promise<UserPreference | null> {
    const collection = await this.#getCollection();
    return collection.findOne({ userId: ObjectId.createFromHexString(userId) });
  }

  async updateByUserId(
    userId: string,
    changes: UserPreferenceUpdate,
  ): Promise<UpdateResult<UserPreference>> {
    const collection = await this.#getCollection();
    return collection.updateOne(
      { userId: ObjectId.createFromHexString(userId) },
      {
        $set: { ...changes, updatedAt: new Date() },
      },
    );
  }

  async #getCollection(): Promise<Collection<UserPreference>> {
    const db = await useDatabase();
    return db.collection<UserPreference>(this.#collectionName);
  }
}

export default UserPreferencesRepo;
