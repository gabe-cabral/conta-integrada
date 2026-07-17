import assert from 'node:assert';

import type {
  Binary,
  ClientEncryption,
  ClientEncryptionEncryptOptions,
  Collection,
  DeleteResult,
  Document,
  Filter,
  FindOptions,
  InferIdType,
  OptionalUnlessRequiredId,
  UpdateFilter,
  UpdateResult,
} from 'mongodb';

import { useSecureClient } from '../utils/mongo.js';

class BaseSecureRepo<
  TModel,
  TDocument extends Document,
  TCreateRecord,
  TUpdateRecord,
  TRecordId,
> {
  #clientEncryption: ClientEncryption | null = null;

  #collection: Collection<TDocument> | null = null;

  readonly #collectionName: string;

  constructor(collectionName: string) {
    assert(
      typeof collectionName === 'string' && collectionName.length > 0,
      'Collection name must be a non-empty string',
    );

    this.#collectionName = collectionName;
  }

  async deleteRecord(recordId: TRecordId): Promise<DeleteResult> {
    try {
      const collection = await this.getCollection();
      return collection.deleteOne(this.getRecordFilter(recordId));
    } catch (error) {
      throw this.interceptError(error);
    }
  }

  async encryptDeterministic(value: unknown): Promise<Binary> {
    return this.encryptField(
      value,
      'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic',
    );
  }

  async encryptField(
    value: unknown,
    algorithm: ClientEncryptionEncryptOptions['algorithm'],
  ): Promise<Binary> {
    if (!this.#clientEncryption) await this.getCollection();

    assert(this.#clientEncryption, 'ClientEncryption must be initialized');

    return this.#clientEncryption.encrypt(value, {
      algorithm,
      keyAltName: this.getEncryptionKeyAltName(),
    });
  }

  async encryptRandom(value: unknown): Promise<Binary> {
    return this.encryptField(value, 'AEAD_AES_256_CBC_HMAC_SHA_512-Random');
  }

  async getRecordById(recordId: TRecordId): Promise<TModel | null> {
    const collection = await this.getCollection();
    const result = await collection.findOne(this.getRecordFilter(recordId));

    return result as TModel | null;
  }

  async getRecords(
    filter: Filter<TDocument> = {},
    options?: FindOptions,
  ): Promise<TModel[]> {
    const collection = await this.getCollection();
    const results = await collection.find(filter, options).toArray();

    return results as unknown as TModel[];
  }

  async insertManyRecords(
    records: TCreateRecord[],
  ): Promise<InferIdType<TDocument>[]> {
    try {
      const documents: OptionalUnlessRequiredId<TDocument>[] = [];
      const collection = await this.getCollection();

      for (const record of records)
        documents.push(await this.mapDocument(record));

      const result = await collection.insertMany(documents);
      return Object.values(result.insertedIds);
    } catch (error) {
      throw this.interceptError(error);
    }
  }

  async insertRecord(
    record: TCreateRecord,
  ): Promise<InferIdType<TDocument> | null> {
    try {
      const collection = await this.getCollection();
      const document = await this.mapDocument(record);
      const result = await collection.insertOne(document);

      return result.acknowledged ? (result.insertedId ?? null) : null;
    } catch (error) {
      throw this.interceptError(error);
    }
  }

  async updateRecord(
    recordId: TRecordId,
    changes: TUpdateRecord,
  ): Promise<UpdateResult<TDocument>> {
    try {
      const collection = await this.getCollection();
      const data = await this.mapUpdateDocument(changes);
      const update = { $set: data } as UpdateFilter<TDocument>;

      return collection.updateOne(this.getRecordFilter(recordId), update);
    } catch (error) {
      throw this.interceptError(error);
    }
  }

  protected getCollection = async (): Promise<Collection<TDocument>> => {
    if (this.#collection) return this.#collection;

    const { db, clientEncryption } = await useSecureClient();

    this.#clientEncryption = clientEncryption;
    this.#collection = db.collection<TDocument>(this.#collectionName);

    return this.#collection;
  };

  protected getEncryptionKeyAltName(): string {
    throw new Error('Encryption key alternate name is not configured');
  }

  protected getRecordFilter(recordId: TRecordId): Filter<TDocument> {
    return { _id: recordId } as Filter<TDocument>;
  }

  protected interceptError(error: unknown): unknown {
    console.error(error);
    return error;
  }

  protected async mapDocument(
    record: TCreateRecord,
  ): Promise<OptionalUnlessRequiredId<TDocument>> {
    return record as unknown as OptionalUnlessRequiredId<TDocument>;
  }

  protected async mapUpdateDocument(
    record: TUpdateRecord,
  ): Promise<Partial<TDocument>> {
    return record as unknown as Partial<TDocument>;
  }
}

export { BaseSecureRepo };
export default BaseSecureRepo;
