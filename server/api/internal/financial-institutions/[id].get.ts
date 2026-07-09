import z from 'zod';
import FinancialInstitutionsRepo from '~~/server/repositories/FinancialInstitutionsRepo';

const routeSchema = z.strictObject({
  id: z.string().trim().length(24),
});

export default defineEventHandler(async (event) => {
  requireInternalApiAccess(event);

  const { id } = await getValidatedRouterParams(event, routeSchema.parse);
  const repository = new FinancialInstitutionsRepo();
  const record = await repository.getRecordById(id);

  if (!record) {
    throw createError({ statusCode: 404, message: `Financial institution ${id} not found` });
  }

  return record;
});
