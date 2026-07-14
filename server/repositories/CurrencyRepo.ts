import type { Collection, DeleteResult, Filter, UpdateResult } from 'mongodb';
import { MongoServerError } from 'mongodb';
import { useDatabase } from '~~/server/utils/mongo';
import type { CurrencyDetail, CurrencyCode, CurrencyCreate, CurrencyUpdate } from '~~/shared/schemas/currency';

export type CurrencyOption = Pick<CurrencyDetail, '_id' | 'names' | 'symbol'>;

class CurrencyRepo {
  readonly #collectionName = 'currency';

  async #getCollection(): Promise<Collection<CurrencyDetail>> {
    const db = await useDatabase();
    return db.collection(this.#collectionName) as Collection<CurrencyDetail>;
  }

  async getCurrenciesByIds(ids: CurrencyCode[], active?: boolean): Promise<CurrencyDetail[]> {
    const collection = await this.#getCollection();
    const filter: Filter<CurrencyDetail> = { _id: { $in: ids } };

    if (active !== undefined) filter.active = active;

    return collection.find(filter).sort({ _id: 1 }).toArray();
  }

  async getCurrenciesByCountry(countryCode: string, active?: boolean): Promise<CurrencyDetail[]> {
    const collection = await this.#getCollection();
    const filter: Filter<CurrencyDetail> = { 'countryUsage.countryCode': countryCode };

    if (active !== undefined) filter.active = active;

    return collection.find(filter).sort({ _id: 1 }).toArray();
  }

  async listCurrencies(filter: Pick<CurrencyDetail, 'active'> | Filter<CurrencyDetail> = {}): Promise<CurrencyDetail[]> {
    const collection = await this.#getCollection();
    return collection.find(filter).sort({ _id: 1 }).toArray();
  }

  async listActiveCurrencyOptions(): Promise<CurrencyOption[]> {
    const collection = await this.#getCollection();

    return collection.aggregate<CurrencyOption>([
      { $match: { active: true } },
      { $project: { _id: 1, names: 1, symbol: 1 } },
      { $sort: { _id: 1 } },
    ]).toArray();
  }

  async getCurrencyById(id: CurrencyCode): Promise<CurrencyDetail | null> {
    const collection = await this.#getCollection();
    return collection.findOne({ _id: id });
  }

  async insertCurrency(record: CurrencyCreate): Promise<CurrencyCode> {
    const collection = await this.#getCollection();

    try {
      const result = await collection.insertOne(record);
      return result.insertedId;
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        throw new Error('Currency already exists');
      }

      throw error;
    }
  }

  async updateCurrency(id: CurrencyCode, changes: CurrencyUpdate): Promise<UpdateResult<CurrencyDetail>> {
    const collection = await this.#getCollection();

    return collection.updateOne(
      { _id: id },
      { $set: changes },
    );
  }

  async deleteCurrency(id: CurrencyCode): Promise<DeleteResult> {
    const collection = await this.#getCollection();
    return collection.deleteOne({ _id: id });
  }
}

export { CurrencyRepo };
export default CurrencyRepo;
