import { MongoServerError, ObjectId } from 'mongodb';
import { useDatabase } from '~~/server/utils/mongo';

import type {
  FinancialInstitution,
  FinancialInstitutionCreate,
  FinancialInstitutionIdentifier,
  FinancialInstitutionListQuery,
  FinancialInstitutionUpdate,
} from '~~/shared/schemas/financialInstitutions';
import type {
  Collection, Filter, OptionalUnlessRequiredId, UpdateResult, WithId,
} from 'mongodb';

type FinancialInstitutionDocument = Omit<FinancialInstitution, '_id'> & {
  _id?: ObjectId
};

type FinancialInstitutionRecord = WithId<FinancialInstitutionDocument>;

class FinancialInstitutionsRepo {
  readonly #collectionName = 'financial_institutions';

  async deleteRecord(id: string): Promise<boolean> {
    const collection = await this.#getCollection();
    const result = await collection.deleteOne({ _id: this.#toObjectId(id) });
    return result.deletedCount > 0;
  }

  async getRecordById(id: string | ObjectId): Promise<FinancialInstitutionRecord | null> {
    const collection = await this.#getCollection();
    return collection.findOne({ _id: this.#toObjectId(id) });
  }

  async insertRecord(record: FinancialInstitutionCreate): Promise<string> {
    const collection = await this.#getCollection();
    const now = new Date();
    const document: OptionalUnlessRequiredId<FinancialInstitutionDocument> = {
      ...record,
      alternateNames: record.alternateNames ?? [],
      regulatoryRegistrations: record.regulatoryRegistrations ?? [],
      createdAt: now,
      updatedAt: null,
      lastSyncedAt: record.lastSyncedAt ?? null,
    };

    this.#assertNoRepeatedIdentifiers(document.identifiers);
    await this.#assertIdentifiersAvailable(document.countryCode, document.identifiers);

    try {
      const result = await collection.insertOne(document);
      return result.insertedId.toHexString();
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        throw new Error('Financial institution id already exists');
      }

      throw error;
    }
  }

  async listRecords(query: FinancialInstitutionListQuery): Promise<FinancialInstitutionRecord[]> {
    const collection = await this.#getCollection();
    const filter: Filter<FinancialInstitutionDocument> = {};

    if (query.countryCode) filter.countryCode = query.countryCode;
    if (query.status) filter.status = query.status;
    if (query.institutionType) filter.institutionType = query.institutionType;

    if (query.q) {
      filter.$text = { $search: query.q };
    }

    return collection
      .find(filter)
      .sort({ countryCode: 1, displayName: 1, name: 1 })
      .skip(query.offset)
      .limit(query.limit)
      .toArray();
  }

  async updateRecord(id: string, changes: FinancialInstitutionUpdate): Promise<UpdateResult> {
    const recordId = this.#toObjectId(id);
    const existing = await this.getRecordById(recordId);

    if (!existing) {
      throw new Error('Financial institution not found');
    }

    const collection = await this.#getCollection();
    const nextCountryCode = changes.countryCode ?? existing.countryCode;
    const nextIdentifiers = changes.identifiers ?? existing.identifiers;

    this.#assertNoRepeatedIdentifiers(nextIdentifiers);
    await this.#assertIdentifiersAvailable(nextCountryCode, nextIdentifiers, recordId);

    return collection.updateOne(
      { _id: recordId },
      {
        $set: {
          ...changes,
          updatedAt: new Date(),
        },
      },
    );
  }

  async #assertIdentifiersAvailable(
    countryCode: string,
    identifiers: FinancialInstitutionIdentifier[],
    ignoreId?: string | ObjectId,
  ): Promise<void> {
    const collection = await this.#getCollection();

    for (const identifier of identifiers) {
      const identifierCountryCode = identifier.countryCode ?? countryCode;
      const conflict = await collection.findOne({
        ...(ignoreId ? { _id: { $ne: this.#toObjectId(ignoreId) } } : {}),
        countryCode,
        identifiers: {
          $elemMatch: {
            scheme: identifier.scheme,
            value: identifier.value,
            $or: [
              { countryCode: { $exists: false } },
              { countryCode: identifierCountryCode },
            ],
          },
        },
      });

      if (conflict) {
        throw new Error(`Financial institution identifier already exists: ${this.#identifierKey(identifierCountryCode, identifier.scheme, identifier.value)}`);
      }
    }
  }

  #assertNoRepeatedIdentifiers(identifiers: FinancialInstitutionIdentifier[]): void {
    const keys = new Set<string>();

    for (const identifier of identifiers) {
      const key = this.#identifierKey(identifier.countryCode, identifier.scheme, identifier.value);

      if (keys.has(key)) {
        throw new Error(`Repeated financial institution identifier: ${key}`);
      }

      keys.add(key);
    }
  }

  async #getCollection(): Promise<Collection<FinancialInstitutionDocument>> {
    const db = await useDatabase();
    return db.collection(this.#collectionName) as Collection<FinancialInstitutionDocument>;
  }

  #identifierKey(countryCode: string | undefined, scheme: string, value: string): string {
    return [countryCode ?? '', scheme, value].join(':');
  }

  #toObjectId(id: string | ObjectId): ObjectId {
    return id instanceof ObjectId ? id : ObjectId.createFromHexString(id);
  }
}

export { FinancialInstitutionsRepo };
export default FinancialInstitutionsRepo;
