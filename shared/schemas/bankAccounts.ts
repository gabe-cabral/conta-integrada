import { z } from 'zod';

import { userAuditableRecordSchema } from '../zod/zodBase.js';
import { MoneySchema } from '../zod/zodFinance.js';

export const accountTypeSchema = z.enum([
  'CHECKING', 'CREDIT_CARD', 'INVESTMENT', 'LOAN', 'OTHER', 'SAVINGS', 'WALLET',
]);

export const ACCOUNT_TYPES = accountTypeSchema.options;
export type AccountType = z.infer<typeof accountTypeSchema>;

export const bankAccountSchema = userAuditableRecordSchema.extend({
  _id: z.nullish(z.string().length(24)),
  type: accountTypeSchema,
  name: z.string().min(3).max(100),
  brand: z.string().min(1).max(100),
  number: z.string().max(100).optional(),
  current: MoneySchema,
  income: MoneySchema,
  expenses: MoneySchema,
});

export const bankAccountCreateSchema = bankAccountSchema.omit({
  _id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export type BankAccountData = z.input<typeof bankAccountSchema>;
export type BankAccount = z.infer<typeof bankAccountSchema>;
export type BankAccountCreateData = z.input<typeof bankAccountCreateSchema>;
export type BankAccountCreate = z.infer<typeof bankAccountCreateSchema>;
