import { z } from 'zod';
import ExchangeRateSnapshotsRepo from '~~/server/repositories/ExchangeRateSnapshotsRepo';
import { exchangeRateSnapshotIdSchema } from '~~/shared/schemas/exchangeRateSnapshots';

const routeSchema = z.strictObject({
  id: exchangeRateSnapshotIdSchema,
});

export default defineEventHandler(async (event) => {
  requireInternalApiAccess(event);

  const { id } = await getValidatedRouterParams(event, routeSchema.parse);
  const repository = new ExchangeRateSnapshotsRepo();
  const result = await repository.deleteSnapshot(id);

  if (result.deletedCount === 0) {
    throw createError({ statusCode: 404, message: `Exchange rate snapshot ${id} not found` });
  }

  return { ok: true };
});
