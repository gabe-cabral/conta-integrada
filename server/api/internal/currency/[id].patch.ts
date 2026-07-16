import { currencyCodeSchema, currencyUpdateSchema } from '~~/shared/schemas/currency';
import CurrencyRepo from '~~/server/repositories/CurrencyRepo';
import { z } from 'zod';

const routeSchema = z.strictObject({
  id: currencyCodeSchema,
});

export default defineEventHandler(async (event) => {
  requireInternalApiAccess(event);

  const { id } = await getValidatedRouterParams(event, routeSchema.parse);
  const body = await readValidatedBody(event, currencyUpdateSchema.parse);
  const repository = new CurrencyRepo();
  const result = await repository.updateCurrency(id, body);

  if (result.matchedCount === 0) {
    throw createError({ statusCode: 404, message: `Currency ${id} not found` });
  }

  return repository.getCurrencyById(id);
});
