import { z } from 'zod';

import { FINANCIAL_SPACE_ICONS } from '../constants/financialSpaces.js';
import { userAuditableRecordWithIdSchema } from '../zod/zodBase.js';
import { currencyCodeSchema } from './currency.js';
import { zodObjectId } from '../zod/mongodb.js';

export {
  FINANCIAL_SPACE_ICON_GROUPS,
  FINANCIAL_SPACE_ICONS,
} from '../constants/financialSpaces.js';

export const financialSpaceIconSchema = z.enum(FINANCIAL_SPACE_ICONS);
export const financialSpaceCategoryModeSchema = z.enum(['all', 'selected']);

const graphemeSegmenter = new Intl.Segmenter('pt', { granularity: 'grapheme' });

export function countTextCharacters(value: string): number {
  return [...graphemeSegmenter.segment(value)].length;
}

const financialSpaceFieldsSchema = z.strictObject({
  name: z
    .string()
    .trim()
    .refine((value) => countTextCharacters(value) >= 2, {
      message: 'Name must have at least 2 characters',
    })
    .refine((value) => countTextCharacters(value) <= 20, {
      message: 'Name must have at most 20 characters',
    }),
  description: z
    .string()
    .trim()
    .refine((value) => countTextCharacters(value) <= 150, {
      message: 'Description must have at most 150 characters',
    })
    .optional(),
  icon: financialSpaceIconSchema.optional(),
  color: z
    .string()
    .regex(/^#[0-9a-f]{6}$/i)
    .optional(),
  categoryMode: financialSpaceCategoryModeSchema,
  categoryIds: z.array(zodObjectId),
  currencies: z.array(currencyCodeSchema).min(1).optional(),
  showOnDashboard: z.boolean(),
});

function validateFinancialSpaceCollections(
  space: Pick<
    z.infer<typeof financialSpaceFieldsSchema>,
    'categoryMode' | 'categoryIds' | 'currencies'
  >,
  context: z.RefinementCtx,
) {
  if (space.categoryMode === 'all' && space.categoryIds.length > 0) {
    context.addIssue({
      code: 'custom',
      path: ['categoryIds'],
      message: 'categoryIds must be empty when categoryMode is all',
    });
  }

  if (new Set(space.categoryIds).size !== space.categoryIds.length) {
    context.addIssue({
      code: 'custom',
      path: ['categoryIds'],
      message: 'categoryIds must not contain duplicates',
    });
  }

  if (space.currencies && new Set(space.currencies).size !== space.currencies.length) {
    context.addIssue({
      code: 'custom',
      path: ['currencies'],
      message: 'currencies must not contain duplicates',
    });
  }
}

export const financialSpaceSchema = userAuditableRecordWithIdSchema
  .extend(financialSpaceFieldsSchema.shape)
  .superRefine(validateFinancialSpaceCollections);

export const financialSpaceCreateSchema = financialSpaceFieldsSchema.superRefine(
  validateFinancialSpaceCollections,
);

export const financialSpaceUpdateSchema = financialSpaceFieldsSchema
  .partial()
  .refine((changes) => Object.keys(changes).length > 0, {
    message: 'At least one financial space field must be provided',
  });

export type FinancialSpace = z.infer<typeof financialSpaceSchema>;
export type FinancialSpaceData = z.input<typeof financialSpaceSchema>;
export type FinancialSpaceCreate = z.infer<typeof financialSpaceCreateSchema>;
export type FinancialSpaceCreateData = z.input<typeof financialSpaceCreateSchema>;
export type FinancialSpaceUpdate = z.infer<typeof financialSpaceUpdateSchema>;
export type FinancialSpaceUpdateData = z.input<typeof financialSpaceUpdateSchema>;
