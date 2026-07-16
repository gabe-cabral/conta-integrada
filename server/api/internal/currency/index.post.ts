import { currencyCreateSchema } from '~~/shared/schemas/currency';
import CurrencyRepo from '~~/server/repositories/CurrencyRepo';

export default defineEventHandler(async (event) => {
  requireInternalApiAccess(event);

  const body = await readValidatedBody(event, currencyCreateSchema.parse);
  const repository = new CurrencyRepo();

  try {
    const id = await repository.insertCurrency(body);
    const record = await repository.getCurrencyById(id);

    if (!record) {
      throw createError({ statusCode: 500, message: 'Failed to load created currency' });
    }

    return record;
  } catch (error) {
    if (error instanceof Error && error.message.includes('already')) {
      throw createError({ statusCode: 409, message: error.message });
    }

    throw error;
  }
});
