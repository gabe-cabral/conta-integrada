import type { AuditableRecord } from './base';
import type { Money } from "./finances";

export interface Card extends AuditableRecord {
  brand: string;
  title: string;
  number: string;
  current: Money;
  invoiceDate: Date;
}

export type AccountType = 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD' | 'INVESTMENT' | 'LOAN' | 'WALLET' | 'OTHER';

export interface Account extends AuditableRecord {
  _id: string;
  type: AccountType;
  name: string;
  brand: string;
  number: string;
  current: Money;
  income: Money;
  expenses: Money;
}
