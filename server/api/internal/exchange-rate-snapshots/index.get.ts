import { exchangeRateSnapshotListQuerySchema } from '~~/shared/schemas/exchangeRateSnapshots';
import ExchangeRateSnapshotsRepo from '~~/server/repositories/ExchangeRateSnapshotsRepo';

export default defineEventHandler(async (event) => {
  requireInternalApiAccess(event);

  const query = await getValidatedQuery(event, exchangeRateSnapshotListQuerySchema.parse);
  const repository = new ExchangeRateSnapshotsRepo();

  return repository.listSnapshots(query);
});
