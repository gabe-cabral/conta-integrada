import { z } from 'zod';

import { zodBsonDatetime, zodBsonEncrypt } from '#shared/zod/mongodb.ts';

const bsonObjectId = z.unknown().meta({ bsonType: 'objectId' });

export const transactionsSchema = z
  .object({
    userId: bsonObjectId,
    _id: bsonObjectId,
    date: zodBsonDatetime,
    datePrecision: z.enum(['DATE', 'DATETIME']),
    description: zodBsonEncrypt,
    amount: zodBsonEncrypt,
    type: z.enum([
      'ADJUSTMENT',
      'CONTRIBUTION',
      'DIVIDEND',
      'EXPENSE',
      'INCOME',
      'INTEREST',
      'INVESTMENT',
      'REDEMPTION',
      'REFUND',
      'TAX',
      'TRANSFER',
    ]),
    status: z.enum(['CANCELED', 'CONFIRMED', 'PENDING']),
    categoryId: bsonObjectId.nullable(),
    sourceId: bsonObjectId,
    sourceType: z.enum([
      'CHECKING',
      'CREDIT_CARD',
      'INVESTMENT',
      'LOAN',
      'OTHER',
      'SAVINGS',
      'WALLET',
    ]),
    destinationId: bsonObjectId.nullable(),
    destinationType: z.nullable(
      z.enum(['CHECKING', 'CREDIT_CARD', 'INVESTMENT', 'LOAN', 'OTHER', 'SAVINGS', 'WALLET']),
    ),
    tags: z.array(bsonObjectId),
    attachmentsCount: z.number().nonnegative(),
    hasRecurrence: z.boolean(),
    recurrence: zodBsonEncrypt,
    createdAt: zodBsonDatetime,
    updatedAt: zodBsonDatetime.nullable(),
    conciliationId: bsonObjectId.nullable(),
  })
  .meta({
    title: 'Transaction',
    description: 'Schema for financial transactions',
  });

export type TransactionSchema = z.infer<typeof transactionsSchema>;
