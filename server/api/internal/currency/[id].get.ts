import { z } from 'zod';
import CurrencyRepo from '~~/server/repositories/CurrencyRepo';
import { currencyCodeSchema } from '~~/shared/schemas/currency';

const routeSchema = z.strictObject({
  id: currencyCodeSchema,
});

export default defineEventHandler(async (event) => {
  requireInternalApiAccess(event);

  const { id } = await getValidatedRouterParams(event, routeSchema.parse);
  const repository = new CurrencyRepo();
  const record = await repository.getCurrencyById(id);

  if (!record) {
    throw createError({ statusCode: 404, message: `Currency ${id} not found` });
  }

  return record;
});
