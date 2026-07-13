import ExchangeRateSnapshotsRepo from '~~/server/repositories/ExchangeRateSnapshotsRepo';
import { exchangeRateSnapshotLatestQuerySchema } from '~~/shared/schemas/exchangeRateSnapshots';

export default defineEventHandler(async (event) => {
  requireInternalApiAccess(event);

  const query = await getValidatedQuery(event, exchangeRateSnapshotLatestQuerySchema.parse);
  const repository = new ExchangeRateSnapshotsRepo();
  const record = await repository.getLatestSnapshot(query);

  if (!record) {
    throw createError({ statusCode: 404, message: 'Exchange rate snapshot not found' });
  }

  return record;
});
