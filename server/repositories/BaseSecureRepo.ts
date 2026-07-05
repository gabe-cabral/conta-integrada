import type {
  Binary,
  ClientEncryption,
  ClientEncryptionEncryptOptions,
  Collection,
  DeleteResult,
  Document,
  Filter,
  FindOptions,
  OptionalUnlessRequiredId,
  UpdateFilter,
  UpdateResult,
  WithId,
} from "mongodb";
import { ObjectId } from "mongodb";
import assert from 'node:assert';
import { useSecureClient } from "../../server/utils/mongo.js";
import { getKeyAltName } from "../utils/key-alt-name.js";
import type { UserAuditableRecord } from '../../shared/zod/zodBase.js';

type UserScopedModel = UserAuditableRecord & {
  _id?: string | null;
};

export type CreateUserScopedRecord<TModel extends UserScopedModel> =
  Omit<TModel, '_id' | 'userId' | 'createdAt' | 'updatedAt'>;

export type UpdateUserScopedRecord<TModel extends UserScopedModel> =
  Partial<CreateUserScopedRecord<TModel>>;

type CreateRecordWithAudit<TModel extends UserScopedModel> = Omit<TModel, '_id'>;

class BaseSecureUserScopedRepo<TModel extends UserScopedModel, TDocument extends Document> {
  #collectionName: string;

  #userId: ObjectId;

  #collection: Collection<OptionalUnlessRequiredId<TDocument>> | null = null;

  #clientEncryption: ClientEncryption | null = null;

  constructor(collectionName: string, userId: string | ObjectId) {
    assert(typeof collectionName === 'string' && collectionName.length > 0, 'Collection name must be a non-empty string');
    assert((typeof userId === 'string' && userId.length === 24) || userId instanceof ObjectId, 'User ID must be a 24-character string or an ObjectId');
    assert(userId instanceof ObjectId || ObjectId.isValid(userId), 'User ID must be a valid ObjectId');

    this.#collectionName = collectionName;
    this.#userId = userId instanceof ObjectId ? userId : ObjectId.createFromHexString(userId);
  }

  protected getCollection = async (): Promise<Collection<OptionalUnlessRequiredId<TDocument>>> => {
    if (this.#collection) return this.#collection;

    const { db, clientEncryption } = await useSecureClient();

    this.#clientEncryption = clientEncryption;
    this.#collection = db.collection(this.#collectionName) as Collection<OptionalUnlessRequiredId<TDocument>>;

    return this.#collection;
  }

  protected get userObjectId(): ObjectId {
    return this.#userId;
  }

  protected get userId(): string {
    return this.#userId.toHexString();
  }

  protected toObjectId(id: string | ObjectId): ObjectId {
    assert(id instanceof ObjectId || ObjectId.isValid(id), 'ID must be a valid ObjectId');
    return id instanceof ObjectId ? id : ObjectId.createFromHexString(id);
  }

  #interceptError = (error: unknown) => {
    console.error(error);
    return error;
  }

  protected buildCreateRecord(record: CreateUserScopedRecord<TModel>): CreateRecordWithAudit<TModel> {
    return {
      ...record,
      userId: this.userId,
      createdAt: new Date(),
      updatedAt: null,
    } as CreateRecordWithAudit<TModel>;
  }

  protected mapDocument(record: CreateRecordWithAudit<TModel>): Promise<OptionalUnlessRequiredId<TDocument>> {
    throw new Error('mapDocument must be implemented by subclass');
  }

  protected async mapUpdateDocument(record: UpdateUserScopedRecord<TModel>): Promise<Partial<TDocument>> {
    return record as Partial<TDocument>;
  }

  async encryptField(value: any, algorithm: ClientEncryptionEncryptOptions['algorithm']): Promise<Binary> {
    assert(this.#userId, 'User ID must be set');

    if (!this.#clientEncryption) await this.getCollection();

    assert(this.#clientEncryption, 'ClientEncryption must be initialized');

    const keyAltName = getKeyAltName(this.#userId.toHexString());

    return this.#clientEncryption!.encrypt(value, {
      algorithm,
      keyAltName,
    });
  }

  async encryptRandom(value: any): Promise<Binary> {
    return this.encryptField(value, 'AEAD_AES_256_CBC_HMAC_SHA_512-Random');
  }

  async encryptDeterministic(value: any): Promise<Binary> {
    return this.encryptField(value, 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic');
  }

  async insertRecord(record: CreateUserScopedRecord<TModel>): Promise<ObjectId | null> {
    try {
      const collection = await this.getCollection();
      const data = await this.mapDocument(this.buildCreateRecord(record));
      const result = await collection.insertOne(data as unknown as OptionalUnlessRequiredId<OptionalUnlessRequiredId<TDocument>>);
      
      return result.acknowledged ? result.insertedId ?? null : null;
    } catch (error) {
      throw this.#interceptError(error);
    }
  }

  async insertManyRecords(records: CreateUserScopedRecord<TModel>[]): Promise<string[]> {
    try {
      const documents: OptionalUnlessRequiredId<TDocument>[] = [];
      const collection = await this.getCollection();

      for (const item of records) {
        const data = await this.mapDocument(this.buildCreateRecord(item));
        documents.push(data);
      }

      const result = await collection.insertMany(documents as unknown as OptionalUnlessRequiredId<OptionalUnlessRequiredId<TDocument>>[]);
      return Object.values(result.insertedIds).flatMap(id => id ? [id.toString()] : []);
    } catch (error) {
      throw this.#interceptError(error);
    }
  }

  async getRecordById(recordId: string | ObjectId): Promise<WithId<TModel> | null> {
    const collection = await this.getCollection();
    const result = await collection.findOne({ $and: [
      { _id: this.toObjectId(recordId) },
      { userId: this.#userId },
    ] } as Filter<OptionalUnlessRequiredId<TDocument>>);

    return result as WithId<TModel> | null;
  }

  async getUserRecords(filter: Filter<TDocument> = {}, options?: FindOptions): Promise<WithId<TModel>[]> {
    const collection = await this.getCollection();
    const results = await collection.find({ $and: [
      filter,
      { userId: this.#userId },
    ] } as Filter<OptionalUnlessRequiredId<TDocument>>, options).toArray();

    return results as unknown as WithId<TModel>[];
  }

  async updateRecord(recordId: string | ObjectId, changes: UpdateUserScopedRecord<TModel>): Promise<UpdateResult> {
    try {
      const collection = await this.getCollection();
      const data = await this.mapUpdateDocument(changes);

      const update: UpdateFilter<OptionalUnlessRequiredId<TDocument>> = {
        $set: {
          ...data,
          updatedAt: new Date(),
        } as Partial<OptionalUnlessRequiredId<TDocument>>,
      };

      return collection.updateOne({ $and: [
        { _id: this.toObjectId(recordId) },
        { userId: this.#userId },
      ] } as Filter<OptionalUnlessRequiredId<TDocument>>, update);
    } catch (error) {
      throw this.#interceptError(error);
    }
  }

  async deleteRecord(recordId: string | ObjectId): Promise<DeleteResult> {
    try {
      const collection = await this.getCollection();

      return collection.deleteOne({ $and: [
        { _id: this.toObjectId(recordId) },
        { userId: this.#userId },
      ] } as Filter<OptionalUnlessRequiredId<TDocument>>);
    } catch (error) {
      throw this.#interceptError(error);
    }
  }
}

export { BaseSecureUserScopedRepo };
export default BaseSecureUserScopedRepo;
