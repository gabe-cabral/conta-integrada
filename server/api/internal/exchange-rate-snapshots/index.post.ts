import { exchangeRateSnapshotCreateSchema } from '~~/shared/schemas/exchangeRateSnapshots';
import ExchangeRateSnapshotsRepo from '~~/server/repositories/ExchangeRateSnapshotsRepo';
import { z } from 'zod';

const querySchema = z.strictObject({
  upsert: z.preprocess((value) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  }, z.boolean().default(false)),
});

export default defineEventHandler(async (event) => {
  requireInternalApiAccess(event);

  const query = await getValidatedQuery(event, querySchema.parse);
  const body = await readValidatedBody(event, exchangeRateSnapshotCreateSchema.parse);
  const repository = new ExchangeRateSnapshotsRepo();

  try {
    const id = query.upsert
      ? await repository.upsertSnapshot(body)
      : await repository.insertSnapshot(body);
    const record = await repository.getSnapshotById(id);

    if (!record) {
      throw createError({ statusCode: 500, message: 'Failed to load exchange rate snapshot' });
    }

    return record;
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      throw createError({ statusCode: 409, message: error.message });
    }

    throw error;
  }
});
