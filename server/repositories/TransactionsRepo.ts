import { ObjectId } from 'mongodb';
import { z } from 'zod';

import type { ClientEncryption, Collection, Document, InsertManyResult } from 'mongodb';
import type { Transaction } from '../../shared/types/transactions.ts';

import { zodBsonDatetime, zodBsonEncrypt, zodObjectId } from '../../shared/zod/mongodb.ts';
import { getKeyAltName } from '../utils/key-alt-name.ts';
import { useSecureClient } from '../utils/mongo.ts';

export const transactionsSchema = z.object({
  userId: zodObjectId,
  _id: zodObjectId,
  date: zodBsonDatetime,
  datePrecision: z.enum(['DATE', 'DATETIME']),
  description: zodBsonEncrypt,
  amount: zodBsonEncrypt,
  type: z.enum(['ADJUSTMENT', 'CONTRIBUTION', 'DIVIDEND', 'EXPENSE', 'INCOME', 'INTEREST', 'INVESTMENT', 'REDEMPTION', 'REFUND', 'TAX', 'TRANSFER']),
  status: z.enum(['CANCELED', 'CONFIRMED', 'PENDING']),
  categoryId: zodObjectId.nullable(),
  sourceId: zodObjectId,
  sourceType: z.enum(['CHECKING', 'CREDIT_CARD', 'INVESTMENT', 'LOAN', 'OTHER', 'SAVINGS', 'WALLET']),
  destinationId: zodObjectId.nullable(),
  destinationType: z.nullable(z.enum(['CHECKING', 'CREDIT_CARD', 'INVESTMENT', 'LOAN', 'OTHER', 'SAVINGS', 'WALLET'])),
  tags: z.array(zodObjectId),
  attachmentsCount: z.number().nonnegative(),
  hasRecurrence: z.boolean(),
  recurrence: zodBsonEncrypt,
  createdAt: zodBsonDatetime,
  updatedAt: zodBsonDatetime.nullable(),
  conciliationId: zodObjectId.nullable(),
}).meta({
  title: 'Transaction',
  description: 'Schema for financial transactions',
});

export type TransactionSchema = z.infer<typeof transactionsSchema>;

class TransactionsRepo {
  async getTransactionById(userId: string | ObjectId, transactionId: string | ObjectId): Promise<TransactionSchema | null> {
    const { collection } = await this.#getCollection();
    return collection.findOne({
      userId: userId instanceof ObjectId ? userId : ObjectId.createFromHexString(userId),
      _id: transactionId instanceof ObjectId ? transactionId : ObjectId.createFromHexString(transactionId),
    });
  }

  async getUserTransactions(userId: ObjectId, dateStart: Date, dateEnd?: Date): Promise<TransactionSchema[] | null> {
    const { collection } = await this.#getCollection();
    const filter: Document = { userId, date: { $gte: dateStart } };

    if (dateEnd) {
      filter.date.$lte = dateEnd;
    }

    return collection.find(filter).toArray();
  }

  async insertManyTransactions(transactions: Omit<Transaction, '_id'>[]): Promise<InsertManyResult<TransactionSchema>> {
    try {
      const documents: Omit<TransactionSchema, '_id'>[] = [];
      const { collection } = await this.#getCollection();

      for await (const item of transactions) {
        const data = await this.#mapDocument(item);
        documents.push(data);
      }

      const result = await collection.insertMany(documents);

      return result;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async insertTransaction(transaction: Omit<Transaction, '_id'>): Promise<string | null> {
    try {
      const { collection } = await this.#getCollection();
      const data = await this.#mapDocument(transaction);
      const result = await collection.insertOne(data);

      return result.acknowledged ? result.insertedId : null;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  #getCollection = async (): Promise<{ clientEncryption: ClientEncryption, collection: Collection<TransactionSchema> }> => {
    const { db, clientEncryption } = await useSecureClient();
    const collection = db.collection('transactions') as Collection<TransactionSchema>;
    return { collection, clientEncryption };
  };

  async #mapDocument(transaction: Omit<Transaction, '_id'> | Transaction): Promise<Omit<TransactionSchema, '_id'> | TransactionSchema> {
    const { collection, clientEncryption } = await this.#getCollection();
    const keyAltName = getKeyAltName(transaction.userId);

    const data: Omit<TransactionSchema, '_id'> = {
      ...transaction,

      tags: transaction.tags || [],
      datePrecision: transaction.datePrecision || 'DATETIME',
      hasRecurrence: !!transaction.recurrence,
      createdAt: new Date(),

      // Nullable fields
      destinationId: transaction.destinationId || null,
      destinationType: transaction.destinationType || null,
      updatedAt: transaction.updatedAt || null,
      conciliationId: transaction.conciliationId || null,

      // IDs
      categoryId: transaction.categoryId ? ObjectId.createFromHexString(transaction.categoryId) : null,
      sourceId: ObjectId.createFromHexString(transaction.sourceId),
      userId: ObjectId.createFromHexString(transaction.userId),

      // Encrypted fields
      description: await clientEncryption.encrypt(transaction.description, {
        algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic',
        keyAltName,
      }),
      amount: await clientEncryption.encrypt(transaction.amount, {
        algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Random',
        keyAltName,
      }),
      recurrence: await clientEncryption.encrypt(transaction.recurrence || {}, {
        algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Random',
        keyAltName,
      }),
    };

    return data;
  }
}

export { TransactionsRepo };
export default TransactionsRepo;
