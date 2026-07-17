import Decimal from 'decimal.js';
import { z } from 'zod';

import { type CurrencyCode, currencyCodeSchema } from './currency.js';
import type { AuditableRecord } from '#shared/zod/zodBase.ts';

export const exchangeRateSnapshotStatusSchema = z.enum(['complete', 'partial']);

export type ExchangeRateSnapshotStatus = z.infer<typeof exchangeRateSnapshotStatusSchema>;

export interface ExchangeRateSnapshotProvider {
  name: string;
  referenceDate?: Date;
  timestamp?: Date;
  retrievedAt: Date;
}

export interface ExchangeRateSnapshotDto extends AuditableRecord {
  _id: string;
  valuationDate: Date;
  baseCurrency: CurrencyCode;
  rates: Record<CurrencyCode, string>;
  provider: ExchangeRateSnapshotProvider;
  carriedForward: boolean;
  status: ExchangeRateSnapshotStatus;
  expectedCurrencies?: CurrencyCode[];
  missingCurrencies?: CurrencyCode[];
}

export type ExchangeRateSnapshotCreate = Omit<
  ExchangeRateSnapshotDto,
  '_id' | 'createdAt' | 'updatedAt'
>;
export type ExchangeRateSnapshotReplace = ExchangeRateSnapshotCreate;
export type ExchangeRateSnapshotUpdate = Partial<ExchangeRateSnapshotCreate>;

const utcDayStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const dateToUtcDayStartSchema = z
  .union([
    z.date(),
    z
      .string()
      .refine((value) => !Number.isNaN(Date.parse(value)), { message: 'Invalid date format' }),
  ])
  .transform((value) => normalizeUtcDayStart(value));

export const exchangeRateSnapshotIdSchema = z
  .string()
  .trim()
  .regex(/^[A-Z]{3}_\d{4}-\d{2}-\d{2}$/);

export const decimalRateStringSchema = z
  .string()
  .trim()
  .refine(
    (value) => {
      try {
        const decimal = new Decimal(value);
        return decimal.isFinite() && decimal.isPositive();
      } catch {
        return false;
      }
    },
    { message: 'Rate must be a positive finite decimal string' },
  );

const ratesSchema = z.record(currencyCodeSchema, decimalRateStringSchema);

const providerSchema = z.strictObject({
  name: z.string().trim().min(1).max(128),
  referenceDate: dateToUtcDayStartSchema.optional(),
  timestamp: z
    .union([
      z.date(),
      z
        .string()
        .refine((value) => !Number.isNaN(Date.parse(value)), { message: 'Invalid date format' })
        .transform((value) => new Date(value)),
    ])
    .optional(),
  retrievedAt: z.union([
    z.date(),
    z
      .string()
      .refine((value) => !Number.isNaN(Date.parse(value)), { message: 'Invalid date format' })
      .transform((value) => new Date(value)),
  ]),
});

const exchangeRateSnapshotPayloadBaseSchema = z.strictObject({
  valuationDate: dateToUtcDayStartSchema,
  baseCurrency: currencyCodeSchema,
  rates: ratesSchema,
  provider: providerSchema,
  carriedForward: z.boolean().default(false),
  status: exchangeRateSnapshotStatusSchema,
  expectedCurrencies: z.array(currencyCodeSchema).optional(),
  missingCurrencies: z.array(currencyCodeSchema).optional(),
});

const exchangeRateSnapshotPayloadSchema =
  exchangeRateSnapshotPayloadBaseSchema.superRefine(validateSnapshotPayload);

export const exchangeRateSnapshotCreateSchema = exchangeRateSnapshotPayloadSchema;
export const exchangeRateSnapshotReplaceSchema = exchangeRateSnapshotPayloadSchema;
export const exchangeRateSnapshotUpdateSchema = exchangeRateSnapshotPayloadBaseSchema
  .partial()
  .superRefine((payload, ctx) => {
    if (!payload.baseCurrency || !payload.rates || !payload.status) return;
    validateSnapshotPayload(payload as ExchangeRateSnapshotCreate, ctx);
  });

export const exchangeRateSnapshotListQuerySchema = z.strictObject({
  baseCurrency: currencyCodeSchema.optional(),
  valuationDate: dateToUtcDayStartSchema.optional(),
  status: exchangeRateSnapshotStatusSchema.optional(),
  from: dateToUtcDayStartSchema.optional(),
  to: dateToUtcDayStartSchema.optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

export const exchangeRateSnapshotLatestQuerySchema = z.strictObject({
  baseCurrency: currencyCodeSchema,
  at: dateToUtcDayStartSchema.optional(),
  status: exchangeRateSnapshotStatusSchema.default('complete'),
});

export type ExchangeRateSnapshotCreateData = z.input<typeof exchangeRateSnapshotCreateSchema>;
export type ExchangeRateSnapshotReplaceData = z.input<typeof exchangeRateSnapshotReplaceSchema>;
export type ExchangeRateSnapshotUpdateData = z.input<typeof exchangeRateSnapshotUpdateSchema>;
export type ExchangeRateSnapshotListQuery = z.infer<typeof exchangeRateSnapshotListQuerySchema>;
export type ExchangeRateSnapshotLatestQuery = z.infer<typeof exchangeRateSnapshotLatestQuerySchema>;

export function buildExchangeRateSnapshotId(
  baseCurrency: CurrencyCode,
  valuationDate: Date,
): string {
  return `${baseCurrency}_${formatUtcDay(valuationDate)}`;
}

export function formatUtcDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function normalizeUtcDayStart(value: Date | string): Date {
  const date =
    value instanceof Date
      ? value
      : utcDayStringSchema.safeParse(value).success
        ? new Date(`${value}T00:00:00.000Z`)
        : new Date(value);

  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function validateSnapshotPayload(payload: ExchangeRateSnapshotCreate, ctx: z.RefinementCtx) {
  const baseRate = payload.rates[payload.baseCurrency];

  if (!baseRate || !new Decimal(baseRate).eq(1)) {
    ctx.addIssue({
      code: 'custom',
      path: [payload.baseCurrency, 'rates'],
      message: 'Rates must include the base currency with value 1',
    });
  }

  if (payload.status === 'complete' && payload.missingCurrencies?.length) {
    ctx.addIssue({
      code: 'custom',
      path: ['missingCurrencies'],
      message: 'Complete snapshots cannot have missing currencies',
    });
  }

  if (!payload.expectedCurrencies || !payload.missingCurrencies) return;

  const expected = new Set(payload.expectedCurrencies);

  for (const currency of payload.missingCurrencies) {
    if (!expected.has(currency)) {
      ctx.addIssue({
        code: 'custom',
        path: ['missingCurrencies'],
        message: 'Missing currencies must be a subset of expected currencies',
      });
      return;
    }
  }
}
