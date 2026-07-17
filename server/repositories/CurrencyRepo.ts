import { MongoServerError } from 'mongodb';
import BaseSecureRepo from './BaseSecureRepo.js';

import type {
  CurrencyCode,
  CurrencyCreate,
  CurrencyDetail,
  CurrencyUpdate,
} from '~~/shared/schemas/currency';
import type { DeleteResult, Filter, UpdateResult } from 'mongodb';

export type CurrencyOption = Pick<CurrencyDetail, '_id' | 'names' | 'symbol'>;

class CurrencyRepo extends BaseSecureRepo<
  CurrencyDetail,
  CurrencyDetail,
  CurrencyCreate,
  CurrencyUpdate,
  CurrencyCode
> {
  constructor() {
    super('currency');
  }

  async deleteCurrency(id: CurrencyCode): Promise<DeleteResult> {
    return this.deleteRecord(id);
  }

  async getCurrenciesByCountry(
    countryCode: string,
    active?: boolean,
  ): Promise<CurrencyDetail[]> {
    const collection = await this.getCollection();
    const filter: Filter<CurrencyDetail> = {
      'countryUsage.countryCode': countryCode,
    };

    if (active !== undefined) filter.active = active;

    return collection.find(filter).sort({ _id: 1 }).toArray();
  }

  async getCurrenciesByIds(
    ids: CurrencyCode[],
    active?: boolean,
  ): Promise<CurrencyDetail[]> {
    const collection = await this.getCollection();
    const filter: Filter<CurrencyDetail> = { _id: { $in: ids } };

    if (active !== undefined) filter.active = active;

    return collection.find(filter).sort({ _id: 1 }).toArray();
  }

  async getCurrencyById(id: CurrencyCode): Promise<CurrencyDetail | null> {
    return this.getRecordById(id);
  }

  async insertCurrency(record: CurrencyCreate): Promise<CurrencyCode> {
    try {
      const insertedId = await this.insertRecord(record);
      if (!insertedId) throw new Error('Failed to insert currency');
      return insertedId;
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        throw new Error('Currency already exists', { cause: error });
      }

      throw error;
    }
  }

  async listActiveCurrencyOptions(): Promise<CurrencyOption[]> {
    const collection = await this.getCollection();

    return collection
      .aggregate<CurrencyOption>([
        { $match: { active: true } },
        { $project: { _id: 1, names: 1, symbol: 1 } },
        { $sort: { _id: 1 } },
      ])
      .toArray();
  }

  async listCurrencies(
    filter: Pick<CurrencyDetail, 'active'> | Filter<CurrencyDetail> = {},
  ): Promise<CurrencyDetail[]> {
    const collection = await this.getCollection();
    return collection.find(filter).sort({ _id: 1 }).toArray();
  }

  async updateCurrency(
    id: CurrencyCode,
    changes: CurrencyUpdate,
  ): Promise<UpdateResult<CurrencyDetail>> {
    return this.updateRecord(id, changes);
  }
}

export { CurrencyRepo };
export default CurrencyRepo;
