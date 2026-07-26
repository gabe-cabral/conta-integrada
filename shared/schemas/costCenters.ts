import { z } from 'zod';

import type { Money } from '../types/finances.js';

import { userAuditableRecordWithIdSchema } from '../zod/zodBase.js';
import { currencyCodeSchema } from './currency.js';
import { zodObjectId } from '../zod/mongodb.js';

export interface CostCenterLimit extends Money {
  period: 'monthly'
}

export const costCenterLimitSchema = z
  .strictObject({
    amountInCents: z.int().nonnegative(),
    currency: currencyCodeSchema,
    period: z.literal('monthly'),
  })
  .transform((limit): CostCenterLimit => limit);

const costCenterFieldsSchema = z.strictObject({
  name: z.string().trim().min(1).max(50),
  description: z.string().trim().optional(),
  limit: costCenterLimitSchema.optional(),
  categoryIds: z.array(zodObjectId),
  active: z.boolean(),
});

function validateCategoryIds(
  costCenter: Pick<z.input<typeof costCenterFieldsSchema>, 'categoryIds'>,
  context: z.RefinementCtx,
) {
  if (new Set(costCenter.categoryIds).size !== costCenter.categoryIds.length) {
    context.addIssue({
      code: 'custom',
      path: ['categoryIds'],
      message: 'categoryIds must not contain duplicates',
    });
  }
}

export const costCenterSchema = userAuditableRecordWithIdSchema
  .extend(costCenterFieldsSchema.shape)
  .superRefine(validateCategoryIds);

export const costCenterCreateSchema = costCenterFieldsSchema.superRefine(validateCategoryIds);

export const costCenterUpdateSchema = costCenterFieldsSchema
  .partial()
  .extend({
    limit: costCenterLimitSchema.nullable().optional(),
  })
  .refine((changes) => Object.keys(changes).length > 0, {
    message: 'At least one cost center field must be provided',
  });

export type CostCenter = z.infer<typeof costCenterSchema>;
export type CostCenterData = z.input<typeof costCenterSchema>;
export type CostCenterCreate = z.infer<typeof costCenterCreateSchema>;
export type CostCenterCreateData = z.input<typeof costCenterCreateSchema>;
export type CostCenterUpdate = z.infer<typeof costCenterUpdateSchema>;
export type CostCenterUpdateData = z.input<typeof costCenterUpdateSchema>;
