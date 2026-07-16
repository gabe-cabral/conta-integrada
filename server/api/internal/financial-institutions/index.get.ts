import { financialInstitutionListQuerySchema } from '~~/shared/schemas/financialInstitutions';
import FinancialInstitutionsRepo from '~~/server/repositories/FinancialInstitutionsRepo';

export default defineEventHandler(async (event) => {
  requireInternalApiAccess(event);

  const query = await getValidatedQuery(event, financialInstitutionListQuerySchema.parse);
  const repository = new FinancialInstitutionsRepo();

  return repository.listRecords(query);
});
