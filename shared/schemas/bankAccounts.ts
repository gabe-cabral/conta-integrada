import { z } from 'zod';
import { MoneySchema } from '../zod/zodFinance.js';
import { userAuditableRecordSchema } from '../zod/zodBase.js';

export const accountTypeSchema = z.enum([
  'CHECKING', 'SAVINGS', 'CREDIT_CARD', 'INVESTMENT', 'LOAN', 'WALLET', 'OTHER',
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

export type BankAccountData = z.input<typeof bankAccountSchema>;
export type BankAccount = z.infer<typeof bankAccountSchema>;
