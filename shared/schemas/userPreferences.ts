import { z } from 'zod';

import { userAuditableRecordWithIdSchema } from '../zod/zodBase.ts';
import { currencyCodeSchema } from './currency.ts';

const userPreferenceBaseSchema = userAuditableRecordWithIdSchema.extend({
  defaultCurrency: currencyCodeSchema,
  currencies: z.array(currencyCodeSchema).min(1),
});

export const userPreferenceSchema = userPreferenceBaseSchema.refine(preference => preference.currencies.includes(preference.defaultCurrency), {
  path: ['defaultCurrency'],
  message: 'Default currency must be included in currencies',
});

export const userPreferenceUpdateSchema = userPreferenceBaseSchema
  .omit({ _id: true, userId: true, createdAt: true, updatedAt: true })
  .partial()
  .refine(preference => Object.keys(preference).length > 0, {
    message: 'At least one preference must be provided',
  });

export type UserPreference = z.infer<typeof userPreferenceSchema>;
export type UserPreferenceCreate = Omit<UserPreference, '_id'>;
export type UserPreferenceUpdate = z.infer<typeof userPreferenceUpdateSchema>;
