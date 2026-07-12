import { z } from 'zod';
import CurrencyRepo from '~~/server/repositories/CurrencyRepo';
import { currencyCodeSchema } from '~~/shared/schemas/currency';

const querySchema = z.strictObject({
  ids: z.preprocess((value) => {
    if (typeof value !== 'string') return value;
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }, z.array(currencyCodeSchema).optional()),
  countryCode: z.string().trim().regex(/^[A-Z]{3}$/).optional(),
  active: z.preprocess((value) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  }, z.boolean().optional()),
});

export default defineEventHandler(async (event) => {
  requireInternalApiAccess(event);

  const query = await getValidatedQuery(event, querySchema.parse);
  const repository = new CurrencyRepo();

  if (query.ids?.length) {
    return repository.getCurrenciesByIds(query.ids, query.active);
  }

  if (query.countryCode) {
    return repository.getCurrenciesByCountry(query.countryCode, query.active);
  }

  return repository.listCurrencies(query.active === undefined ? {} : { active: query.active });
});
