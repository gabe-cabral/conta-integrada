import { MongoServerError, ObjectId } from 'mongodb';
import BaseSecureRepo from './BaseSecureRepo.js';

import type {
  FinancialInstitution,
  FinancialInstitutionCreate,
  FinancialInstitutionIdentifier,
  FinancialInstitutionListQuery,
  FinancialInstitutionUpdate,
} from '~~/shared/schemas/financialInstitutions';
import type {
  DeleteResult,
  Document,
  Filter,
  OptionalUnlessRequiredId,
  UpdateResult,
  WithId,
} from 'mongodb';

type FinancialInstitutionDocument = Omit<FinancialInstitution, '_id'> & {
  _id?: ObjectId;
} & Document;

type FinancialInstitutionRecord = WithId<FinancialInstitutionDocument>;

class FinancialInstitutionsRepo extends BaseSecureRepo<
  FinancialInstitutionRecord,
  FinancialInstitutionDocument,
  FinancialInstitutionCreate,
  FinancialInstitutionUpdate,
  string | ObjectId
> {
  constructor() {
    super('financial_institutions');
  }

  override async deleteRecord(id: string | ObjectId): Promise<DeleteResult> {
    return super.deleteRecord(id);
  }

  override async insertRecord(
    record: FinancialInstitutionCreate,
  ): Promise<ObjectId | null> {
    try {
      return await super.insertRecord(record);
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        throw new Error('Financial institution id already exists', {
          cause: error,
        });
      }

      throw error;
    }
  }

  async listRecords(
    query: FinancialInstitutionListQuery,
  ): Promise<FinancialInstitutionRecord[]> {
    const collection = await this.getCollection();
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

  override async updateRecord(
    id: string,
    changes: FinancialInstitutionUpdate,
  ): Promise<UpdateResult> {
    const recordId = this.toObjectId(id);
    const existing = await this.getRecordById(recordId);

    if (!existing) {
      throw new Error('Financial institution not found');
    }

    const nextCountryCode = changes.countryCode ?? existing.countryCode;
    const nextIdentifiers = changes.identifiers ?? existing.identifiers;

    this.#assertNoRepeatedIdentifiers(nextIdentifiers);
    await this.#assertIdentifiersAvailable(
      nextCountryCode,
      nextIdentifiers,
      recordId,
    );

    return super.updateRecord(recordId, changes);
  }

  async #assertIdentifiersAvailable(
    countryCode: string,
    identifiers: FinancialInstitutionIdentifier[],
    ignoreId?: string | ObjectId,
  ): Promise<void> {
    const collection = await this.getCollection();

    for (const identifier of identifiers) {
      const identifierCountryCode = identifier.countryCode ?? countryCode;
      const conflict = await collection.findOne({
        ...(ignoreId ? { _id: { $ne: this.toObjectId(ignoreId) } } : {}),
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
        throw new Error(
          `Financial institution identifier already exists: ${this.#identifierKey(identifierCountryCode, identifier.scheme, identifier.value)}`,
        );
      }
    }
  }

  #assertNoRepeatedIdentifiers(
    identifiers: FinancialInstitutionIdentifier[],
  ): void {
    const keys = new Set<string>();

    for (const identifier of identifiers) {
      const key = this.#identifierKey(
        identifier.countryCode,
        identifier.scheme,
        identifier.value,
      );

      if (keys.has(key)) {
        throw new Error(`Repeated financial institution identifier: ${key}`);
      }

      keys.add(key);
    }
  }

  protected override getRecordFilter(
    id: string | ObjectId,
  ): Filter<FinancialInstitutionDocument> {
    return { _id: this.toObjectId(id) };
  }

  protected override async mapDocument(
    record: FinancialInstitutionCreate,
  ): Promise<OptionalUnlessRequiredId<FinancialInstitutionDocument>> {
    const document: OptionalUnlessRequiredId<FinancialInstitutionDocument> = {
      ...record,
      alternateNames: record.alternateNames ?? [],
      regulatoryRegistrations: record.regulatoryRegistrations ?? [],
      createdAt: new Date(),
      updatedAt: null,
      lastSyncedAt: record.lastSyncedAt ?? null,
    };

    this.#assertNoRepeatedIdentifiers(document.identifiers);
    await this.#assertIdentifiersAvailable(
      document.countryCode,
      document.identifiers,
    );

    return document;
  }

  protected override async mapUpdateDocument(
    changes: FinancialInstitutionUpdate,
  ): Promise<Partial<FinancialInstitutionDocument>> {
    return { ...changes, updatedAt: new Date() };
  }

  protected toObjectId(id: string | ObjectId): ObjectId {
    return id instanceof ObjectId ? id : ObjectId.createFromHexString(id);
  }

  #identifierKey(
    countryCode: string | undefined,
    scheme: string,
    value: string,
  ): string {
    return [countryCode ?? '', scheme, value].join(':');
  }
}

export { FinancialInstitutionsRepo };
export default FinancialInstitutionsRepo;
