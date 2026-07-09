import z from 'zod';
import FinancialInstitutionsRepo from '~~/server/repositories/FinancialInstitutionsRepo';
import { financialInstitutionUpdateSchema } from '~~/shared/schemas/financialInstitutions';

const routeSchema = z.strictObject({
  id: z.string().trim().length(24),
});

export default defineEventHandler(async (event) => {
  requireInternalApiAccess(event);

  const { id } = await getValidatedRouterParams(event, routeSchema.parse);
  const body = await readValidatedBody(event, financialInstitutionUpdateSchema.parse);
  const repository = new FinancialInstitutionsRepo();

  try {
    const result = await repository.updateRecord(id, body);

    if (result.matchedCount === 0) {
      throw createError({ statusCode: 404, message: 'Financial institution not found' });
    }

    return repository.getRecordById(id);
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      throw createError({ statusCode: 404, message: error.message });
    }

    if (error instanceof Error && error.message.includes('already')) {
      throw createError({ statusCode: 409, message: error.message });
    }

    throw error;
  }
});
