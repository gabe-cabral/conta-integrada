import { z } from 'zod';
import { type Collection, ObjectId } from 'mongodb';
import { useDatabase } from "~~/server/utils/mongo";
import type { Transaction } from "~~/shared/types/transactions";

async function insertTransaction(transaction: Transaction) {
  const db = await useDatabase()
  const collection = db.collection('transactions') as Collection<Transaction>

  const result = await collection.insertOne(transaction, {  })
  return { ok: result.acknowledged };
}

async function updateTransaction(transactionId: string, data: Partial<Transaction>) {
  const db = await useDatabase()
  const collection = db.collection('transactions') as Collection<Transaction>

  const result = await collection.updateOne({ _id: ObjectId.createFromHexString(transactionId) }, { $set: data })
  return { ok: result.modifiedCount > 0 };
}

const postSchema = z.object({
  date: z.string().refine((date) => !isNaN(Date.parse(date)), { message: 'Invalid date format' }).transform((date) => new Date(date)),
  description: z.string().min(1),
  amount: z.number().refine((val) => val > 0, { message: 'Amount must be positive' }),
  type: z.enum(['EXPENSE', 'INCOME', 'TRANSFER', 'INVESTMENT', 'DIVIDEND', 'INTEREST', 'TAX', 'REFUND', 'ADJUSTMENT']),
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELED']),
  categoryId: z.string().optional(),
  sourceId: z.string().min(1),
  destinationId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  attachmentsCount: z.number().min(0).optional(),
  recurrence: z.object({
    id: z.string(),
    frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
    interval: z.number().min(1),
    endDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: 'Invalid date format' }).transform((date) => new Date(date)).optional(),
    occurrences: z.number().min(1).optional(),
    totalOccurrences: z.number().min(1).optional(),
  }).optional(),
})

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);

  try {
    const method = event.node.req.method

    if (method === 'POST') {
      const body = await readValidatedBody(event, postSchema.parse) as unknown as Transaction;

      body.createdAt = new Date();
      body.userId = user.id;

      return insertTransaction(body);
    }
  } catch (error) {
    event.node.res.statusCode = 500;
    return { error: 'Internal Server Error', details: error };
  }
});
