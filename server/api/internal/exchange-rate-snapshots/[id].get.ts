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
  const record = await repository.getSnapshotById(id);

  if (!record) {
    throw createError({ statusCode: 404, message: `Exchange rate snapshot ${id} not found` });
  }

  return record;
});
