import CurrencyRepo from '~~/server/repositories/CurrencyRepo';

export default defineEventHandler(async (event) => {
  await requireUserSession(event);
  return new CurrencyRepo().listActiveCurrencyOptions();
});
