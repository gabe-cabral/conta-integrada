import type { ResolvedUserCategory } from '../schemas/categories.js';
import type { AuditableRecord } from '../zod/zodBase.js';
import type { AccountType } from './resources';
import type { DocumentOwner } from './user';
import type { Money } from './finances';

export type TransactionType
  = | 'EXPENSE' // Gasto
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
  code: TransactionType
  label: string
}

export interface TransactionRecurrence {
  id: string
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  interval: number
  endDate?: Date
  occurrences?: number
  totalOccurrences?: number
}

export type TransactionCategory = ResolvedUserCategory;

export interface Transaction extends DocumentOwner, AuditableRecord {
  _id: string
  date: Date
  datePrecision: 'DATE' | 'DATETIME'
  description: string
  amount: Money
  type: TransactionType
  status: 'PENDING' | 'CONFIRMED' | 'CANCELED'
  categoryId?: string | null
  sourceId: string
  sourceType: AccountType
  destinationId?: string | null
  destinationType?: AccountType | null
  tags?: string[]
  attachmentsCount: number
  hasRecurrence: boolean
  recurrence?: TransactionRecurrence
  conciliationId?: string | null
}

export interface UserTransactionsRequestQuery {
  dateStart: string
  dateEnd?: string
}
