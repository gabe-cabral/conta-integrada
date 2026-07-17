import { z } from 'zod';

export const currencyCodeSchema = z
  .string()
  .trim()
  .regex(/^[A-Z]{3}$/);

export type CurrencyCode = z.infer<typeof currencyCodeSchema>;

export const currencyUsageTypeSchema = z.enum(['official', 'officialParallel', 'widelyAccepted']);

export const CURRENCY_USAGE_TYPES = currencyUsageTypeSchema.options;
export type CurrencyUsageType = z.infer<typeof currencyUsageTypeSchema>;

export interface CurrencyCountryUsage {
  countryCode: string;
  type: CurrencyUsageType;
}

export interface CurrencyDetail {
  _id: CurrencyCode;
  names: Record<string, string>;
  symbol?: string;
  numericCode?: string;
  minorUnit: number;
  countryUsage: CurrencyCountryUsage[];
  active: boolean;
}

const localeTagSchema = z.string().refine((value) => {
  const [language, ...variants] = value.split('-');
  return (
    language.length >= 2 &&
    language.length <= 3 &&
    /^[A-Za-z]+$/.test(language) &&
    variants.every(
      (variant) => variant.length >= 2 && variant.length <= 8 && /^[A-Za-z0-9]+$/.test(variant),
    )
  );
}, 'Must be a valid locale tag');

const localizedNamesSchema = z
  .record(localeTagSchema, z.string().trim().min(1).max(100))
  .refine((names) => typeof names.en === 'string' && names.en.length > 0, {
    message: 'Currency names must include an en fallback',
  });

export const currencyCountryUsageSchema = z.strictObject({
  countryCode: z
    .string()
    .trim()
    .regex(/^[A-Z]{3}$/),
  type: currencyUsageTypeSchema,
});

export const currencySchema = z.strictObject({
  _id: currencyCodeSchema,
  names: localizedNamesSchema,
  symbol: z.string().trim().min(1).max(16).optional(),
  numericCode: z
    .string()
    .trim()
    .regex(/^[0-9]{3}$/)
    .optional(),
  minorUnit: z.number().int().nonnegative(),
  countryUsage: z.array(currencyCountryUsageSchema),
  active: z.boolean(),
});

export const currencyCreateSchema = currencySchema;
export const currencyUpdateSchema = currencySchema.omit({ _id: true }).partial();

export type CurrencyCreateData = z.input<typeof currencyCreateSchema>;
export type CurrencyCreate = z.infer<typeof currencyCreateSchema>;
export type CurrencyUpdateData = z.input<typeof currencyUpdateSchema>;
export type CurrencyUpdate = z.infer<typeof currencyUpdateSchema>;
