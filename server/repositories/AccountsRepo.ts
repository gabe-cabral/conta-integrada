import type { Binary, Document, ObjectId } from 'mongodb';
import type z from 'zod';

import {
  type AccountType,
  accountTypeSchema,
  type BankAccount,
} from '../../shared/schemas/bankAccounts.js';
import BaseSecureUserScopedRepo, { type UpdateUserScopedRecord } from './BaseSecureRepo.js';
import { userAuditableRecordWithIdSchema } from '../../shared/zod/zodBase.js';
import { zodBsonEncrypt } from '../../shared/zod/mongodb.js';

export const accountsDbSchema = userAuditableRecordWithIdSchema
  .extend({
    type: accountTypeSchema,
    name: zodBsonEncrypt,
    brand: zodBsonEncrypt,
    number: zodBsonEncrypt.nullable(),
    current: zodBsonEncrypt,
    income: zodBsonEncrypt,
    expenses: zodBsonEncrypt,
  })
  .meta({
    title: 'Accounts Collection Schema',
    description: 'Schema for financial accounts',
  });

type AccountDbSchema = z.infer<typeof accountsDbSchema>;

type AccountDbDocument = Omit<
  AccountDbSchema,
  '_id' | 'userId' | 'name' | 'brand' | 'number' | 'current' | 'income' | 'expenses'
> & {
  _id?: ObjectId;
  brand: Binary;
  current: Binary;
  expenses: Binary;
  income: Binary;
  name: Binary;
  number: Binary | null;
  type: AccountType;
  userId: ObjectId;
} & Document;

class AccountsRepo extends BaseSecureUserScopedRepo<BankAccount, AccountDbDocument> {
  constructor(userId: string | ObjectId) {
    super('accounts', userId);
  }

  override async mapDocument(record: Omit<BankAccount, '_id'>): Promise<AccountDbDocument> {
    const data: AccountDbDocument = {
      userId: this.userObjectId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt ?? null,
      type: record.type,

      // Encrypted fields
      name: await this.encryptRandom(record.name),
      brand: await this.encryptRandom(record.brand),
      number: record.number ? await this.encryptRandom(record.number) : null,
      current: await this.encryptRandom(record.current),
      income: await this.encryptRandom(record.income),
      expenses: await this.encryptRandom(record.expenses),
    };

    return data;
  }

  override async mapUpdateDocument(
    record: UpdateUserScopedRecord<BankAccount>,
  ): Promise<Partial<AccountDbDocument>> {
    const data: Partial<AccountDbDocument> = {};

    if (record.type !== undefined) data.type = record.type;
    if (record.name !== undefined) data.name = await this.encryptRandom(record.name);
    if (record.brand !== undefined) data.brand = await this.encryptRandom(record.brand);
    if (record.number !== undefined)
      data.number = record.number ? await this.encryptRandom(record.number) : null;
    if (record.current !== undefined) data.current = await this.encryptRandom(record.current);
    if (record.income !== undefined) data.income = await this.encryptRandom(record.income);
    if (record.expenses !== undefined) data.expenses = await this.encryptRandom(record.expenses);

    return data;
  }
}

export { AccountsRepo };
export default AccountsRepo;
