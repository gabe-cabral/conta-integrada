import {
  exchangeRateSnapshotIdSchema,
  exchangeRateSnapshotReplaceSchema,
} from '~~/shared/schemas/exchangeRateSnapshots';
import ExchangeRateSnapshotsRepo from '~~/server/repositories/ExchangeRateSnapshotsRepo';
import { z } from 'zod';

const routeSchema = z.strictObject({
  id: exchangeRateSnapshotIdSchema,
});

export default defineEventHandler(async (event) => {
  requireInternalApiAccess(event);

  const { id } = await getValidatedRouterParams(event, routeSchema.parse);
  const body = await readValidatedBody(event, exchangeRateSnapshotReplaceSchema.parse);
  const repository = new ExchangeRateSnapshotsRepo();

  try {
    const result = await repository.replaceSnapshot(id, body);

    if (result.matchedCount === 0) {
      throw createError({ statusCode: 404, message: `Exchange rate snapshot ${id} not found` });
    }

    return repository.getSnapshotById(id);
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      throw createError({ statusCode: 404, message: error.message });
    }

    if (error instanceof Error && error.message.includes('inconsistent')) {
      throw createError({ statusCode: 400, message: error.message });
    }

    throw error;
  }
});
