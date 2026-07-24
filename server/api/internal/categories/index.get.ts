import {
  categoryKindSchema,
  categoryLevelSchema,
} from '~~/shared/schemas/categories';
import CategoriesRepo from '~~/server/repositories/CategoriesRepo';
import { z } from 'zod';

const querySchema = z.strictObject({
  active: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
  kind: categoryKindSchema.optional(),
  level: categoryLevelSchema.optional(),
});

export default defineEventHandler(async (event) => {
  requireInternalApiAccess(event);
  const query = await getValidatedQuery(event, querySchema.parse);
  const repository = new CategoriesRepo();

  return repository.getRecords(query, { sort: { 'level': 1, 'name.en': 1 } });
});
