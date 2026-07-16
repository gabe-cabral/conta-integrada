import { financialInstitutionCreateSchema } from '~~/shared/schemas/financialInstitutions';
import FinancialInstitutionsRepo from '~~/server/repositories/FinancialInstitutionsRepo';

export default defineEventHandler(async (event) => {
  requireInternalApiAccess(event);

  const body = await readValidatedBody(event, financialInstitutionCreateSchema.parse);
  const repository = new FinancialInstitutionsRepo();

  try {
    const id = await repository.insertRecord(body);
    const record = await repository.getRecordById(id);

    if (!record) {
      throw createError({ statusCode: 500, message: 'Failed to load created financial institution' });
    }

    return record;
  } catch (error) {
    if (error instanceof Error && error.message.includes('already')) {
      throw createError({ statusCode: 409, message: error.message });
    }

    throw error;
  }
});
