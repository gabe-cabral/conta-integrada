import {
  buildExchangeRateSnapshotId,
  exchangeRateSnapshotReplaceSchema,
  normalizeUtcDayStart,
} from '~~/shared/schemas/exchangeRateSnapshots';
import {
  mapSnapshotCreateToDocument,
  mapSnapshotDocumentToDto,
} from '~~/server/utils/exchangeRateSnapshots';
import { MongoServerError } from 'mongodb';
import BaseSecureRepo from './BaseSecureRepo.js';

import type {
  ExchangeRateSnapshotCreate,
  ExchangeRateSnapshotDto,
  ExchangeRateSnapshotLatestQuery,
  ExchangeRateSnapshotListQuery,
  ExchangeRateSnapshotReplace,
} from '~~/shared/schemas/exchangeRateSnapshots';
import type {
  DeleteResult,
  Filter,
  FindOptions,
  OptionalUnlessRequiredId,
  UpdateResult,
} from 'mongodb';
import type { ExchangeRateSnapshotDocument } from '~~/server/utils/exchangeRateSnapshots';

class ExchangeRateSnapshotsRepo extends BaseSecureRepo<
  ExchangeRateSnapshotDocument,
  ExchangeRateSnapshotDocument,
  ExchangeRateSnapshotCreate,
  ExchangeRateSnapshotReplace,
  string
> {
  constructor() {
    super('exchange_rate_snapshots');
  }

  async deleteSnapshot(id: string): Promise<DeleteResult> {
    return this.deleteRecord(id);
  }

  async getLatestSnapshot(
    query: ExchangeRateSnapshotLatestQuery,
  ): Promise<ExchangeRateSnapshotDto | null> {
    const collection = await this.getCollection();
    const at = query.at
      ? normalizeUtcDayStart(query.at)
      : normalizeUtcDayStart(new Date());
    const document = await collection.findOne(
      {
        baseCurrency: query.baseCurrency,
        status: query.status,
        valuationDate: { $lte: at },
      },
      { sort: { valuationDate: -1 } },
    );

    return document ? mapSnapshotDocumentToDto(document) : null;
  }

  async getSnapshotById(id: string): Promise<ExchangeRateSnapshotDto | null> {
    const document = await this.getRecordById(id);

    return document ? mapSnapshotDocumentToDto(document) : null;
  }

  async insertSnapshot(record: ExchangeRateSnapshotCreate): Promise<string> {
    try {
      const insertedId = await this.insertRecord(record);
      if (!insertedId)
        throw new Error('Failed to insert exchange rate snapshot');
      return insertedId;
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        throw new Error('Exchange rate snapshot already exists', {
          cause: error,
        });
      }

      throw error;
    }
  }

  async listSnapshots(
    query: ExchangeRateSnapshotListQuery,
  ): Promise<ExchangeRateSnapshotDto[]> {
    const collection = await this.getCollection();
    const filter: Filter<ExchangeRateSnapshotDocument> = {};

    if (query.baseCurrency) filter.baseCurrency = query.baseCurrency;
    if (query.status) filter.status = query.status;
    if (query.valuationDate) filter.valuationDate = query.valuationDate;

    if (query.from || query.to) {
      filter.valuationDate = {};
      if (query.from) filter.valuationDate.$gte = query.from;
      if (query.to) filter.valuationDate.$lte = query.to;
    }

    const options: FindOptions = {
      sort: { valuationDate: -1, baseCurrency: 1 },
      skip: query.offset,
      limit: query.limit,
    };

    const documents = await collection.find(filter, options).toArray();
    return documents.map(mapSnapshotDocumentToDto);
  }

  async replaceSnapshot(
    id: string,
    record: ExchangeRateSnapshotReplace,
  ): Promise<UpdateResult<ExchangeRateSnapshotDocument>> {
    const collection = await this.getCollection();
    const existing = await collection.findOne({ _id: id });

    if (!existing) {
      throw new Error('Exchange rate snapshot not found');
    }

    const parsed = exchangeRateSnapshotReplaceSchema.parse(record);
    const expectedId = buildExchangeRateSnapshotId(
      parsed.baseCurrency,
      parsed.valuationDate,
    );

    if (expectedId !== id) {
      throw new Error(
        'Snapshot id, baseCurrency and valuationDate are inconsistent',
      );
    }

    const document = mapSnapshotCreateToDocument(
      parsed,
      existing.createdAt,
      new Date(),
    );

    return collection.replaceOne({ _id: id }, document);
  }

  async upsertSnapshot(record: ExchangeRateSnapshotCreate): Promise<string> {
    const collection = await this.getCollection();
    const existing = await collection.findOne({
      baseCurrency: record.baseCurrency,
      valuationDate: normalizeUtcDayStart(record.valuationDate),
    });
    const now = new Date();
    const createdAt = existing?.createdAt ?? now;
    const document = mapSnapshotCreateToDocument(record, createdAt, now);

    await collection.replaceOne({ _id: document._id }, document, {
      upsert: true,
    });

    return document._id;
  }

  protected override async mapDocument(
    record: ExchangeRateSnapshotCreate,
  ): Promise<OptionalUnlessRequiredId<ExchangeRateSnapshotDocument>> {
    const now = new Date();
    return mapSnapshotCreateToDocument(record, now, now);
  }
}

export { ExchangeRateSnapshotsRepo };
export default ExchangeRateSnapshotsRepo;
