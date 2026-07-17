import type { AccountType } from './resources';
import type { DocumentOwner } from './user';
import type { Money } from './finances';
import type { AuditableRecord } from '../zod/zodBase.js';

export type TransactionType =
  | 'EXPENSE' // Gasto
  | 'INCOME' // Receita
  | 'TRANSFER' // Transferência
  | 'INVESTMENT' // Investimento
  | 'DIVIDEND' // Dividendo
  | 'INTEREST' // Juros
  | 'TAX' // Taxa
  | 'REFUND' // Reembolso
  | 'ADJUSTMENT' // Ajuste
  | 'CONTRIBUTION' // Aporte
  | 'REDEMPTION'; // Resgate

export interface TransactionTypeDisplay {
  code: TransactionType;
  label: string;
}

export interface TransactionRecurrence {
  id: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval: number;
  endDate?: Date;
  occurrences?: number;
  totalOccurrences?: number;
}

export interface TransactionCategory {
  _id: string;
  name: string;
  active: boolean;
  color: string;
  parentId?: string;
  kind: TransactionType;
  userId: string;
}

export interface Transaction extends DocumentOwner, AuditableRecord {
  _id: string;
  date: Date;
  datePrecision: 'DATE' | 'DATETIME';
  description: string;
  amount: Money;
  type: TransactionType;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELED';
  categoryId?: string | null;
  sourceId: string;
  sourceType: AccountType;
  destinationId?: string | null;
  destinationType?: AccountType | null;
  tags?: string[];
  attachmentsCount: number;
  hasRecurrence: boolean;
  recurrence?: TransactionRecurrence;
  conciliationId?: string | null;
}

export interface UserTransactionsRequestQuery {
  dateStart: string;
  dateEnd?: string;
}
