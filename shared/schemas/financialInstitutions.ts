import { z } from 'zod';
import { auditableRecordSchema } from '../zod/zodBase.js';
import { currencyCodeSchema, type CurrencyCode } from './currency.js';

/**
 * ISO 3166-1 alpha-2 country code.
 *
 * Examples: `BR`, `CO`, `US`, `GB`.
 */
export type CountryCode = string;

/**
 * Operational status of a financial institution record.
 *
 * `active`: institution is operating.
 * `inactive`: institution is no longer operating.
 * `merged`: institution was merged into another institution.
 * `suspended`: institution is temporarily suspended by a regulator.
 * `unknown`: status was not confirmed by the source.
 */
export const institutionStatusSchema = z.enum([
  'active',
  'inactive',
  'merged',
  'suspended',
  'unknown',
]);

export const INSTITUTION_STATUSES = institutionStatusSchema.options;
export type InstitutionStatus = z.infer<typeof institutionStatusSchema>;

/**
 * Business classification used by the application.
 *
 * `bank`: commercial or universal bank.
 * `credit_union`: cooperative or credit union.
 * `payment_institution`: regulated payment institution.
 * `brokerage`: brokerage or investment intermediary.
 * `digital_wallet`: wallet or stored-value provider.
 * `central_bank`: central monetary authority.
 * `other`: known institution that does not fit another type.
 */
export const institutionTypeSchema = z.enum([
  'bank',
  'credit_union',
  'payment_institution',
  'brokerage',
  'digital_wallet',
  'central_bank',
  'other',
]);

export const INSTITUTION_TYPES = institutionTypeSchema.options;
export type InstitutionType = z.infer<typeof institutionTypeSchema>;

/**
 * Confidence level assigned to identifiers and data sources.
 *
 * `official`: loaded from an official regulator or institution source.
 * `verified`: checked against a trusted non-official source.
 * `inferred`: derived from related data.
 * `community`: contributed by users or community data.
 * `unknown`: confidence was not classified.
 */
export const identifierConfidenceSchema = z.enum([
  'official',
  'verified',
  'inferred',
  'community',
  'unknown',
]);

export const IDENTIFIER_CONFIDENCES = identifierConfidenceSchema.options;
export type IdentifierConfidence = z.infer<typeof identifierConfidenceSchema>;

/**
 * Schema.org type for financial institution records.
 *
 * The application currently stores banks, credit unions, payment institutions
 * and similar providers under `BankOrCreditUnion`.
 */
export const financialInstitutionSchemaTypeSchema = z.enum(['BankOrCreditUnion']);
export type FinancialInstitutionSchemaType = z.infer<typeof financialInstitutionSchemaTypeSchema>;

/**
 * Global and country-scoped identifier schemes supported by the contract.
 *
 * Global schemes do not carry a country prefix. Local schemes use the ISO
 * country prefix, for example `BR_ISPB` or `US_ROUTING_NUMBER`.
 */
export const FINANCIAL_INSTITUTION_IDENTIFIER_SCHEMES = [
  'BIC',
  'LEI',
  'IBAN_REGISTRY',
  'BR_ISPB',
  'BR_COMPE',
  'BR_CNPJ',
  'BR_PIX_PARTICIPANT',
  'US_ROUTING_NUMBER',
  'GB_SORT_CODE',
  'CA_TRANSIT_NUMBER',
  'AU_BSB',
  'IN_IFSC',
  'MX_CLABE_BANK_CODE',
  'CO_NIT',
  'CO_BANK_CODE',
  'EU_NATIONAL_BANK_CODE',
] as const;

export type FinancialInstitutionIdentifierScheme =
  typeof FINANCIAL_INSTITUTION_IDENTIFIER_SCHEMES[number];

export const FINANCIAL_INSTITUTION_IDENTIFIER_SCHEME_DESCRIPTIONS: Record<FinancialInstitutionIdentifierScheme, string> = {
  BIC: 'Business Identifier Code assigned through the SWIFT network.',
  LEI: 'Legal Entity Identifier assigned under the GLEIF system.',
  IBAN_REGISTRY: 'Identifier published in an IBAN registry or national IBAN participant list.',
  BR_ISPB: 'Brazilian ISPB identifier assigned by Banco Central do Brasil.',
  BR_COMPE: 'Brazilian COMPE bank code assigned by Banco Central do Brasil.',
  BR_CNPJ: 'Brazilian national legal entity tax identifier.',
  BR_PIX_PARTICIPANT: 'Brazilian Pix participant identifier assigned by Banco Central do Brasil.',
  US_ROUTING_NUMBER: 'United States ABA routing transit number.',
  GB_SORT_CODE: 'United Kingdom and Ireland sort code.',
  CA_TRANSIT_NUMBER: 'Canadian financial institution and branch transit number.',
  AU_BSB: 'Australian Bank State Branch number.',
  IN_IFSC: 'Indian Financial System Code.',
  MX_CLABE_BANK_CODE: 'Mexican bank code used in CLABE identifiers.',
  CO_NIT: 'Colombian tax identification number.',
  CO_BANK_CODE: 'Colombian national bank code.',
  EU_NATIONAL_BANK_CODE: 'European country-specific national bank identifier when no narrower scheme is modeled yet.',
};

/**
 * Stable identifier for matching a financial institution across integrations.
 */
export interface FinancialInstitutionIdentifier {
  /** Identifier namespace, such as `BR_ISPB`, `BIC` or `LEI`. */
  scheme: string;
  /** Identifier value exactly as published by the issuer, normalized only when safe. */
  value: string;
  /** Authority that issued the identifier, such as `BCB`, `SWIFT` or `GLEIF`. */
  issuer?: string;
  /** ISO 3166-1 alpha-2 country code when the identifier is local to a country. */
  countryCode?: CountryCode;
  /** Marks the preferred identifier for the institution in its country. */
  primary?: boolean;
  /** Confidence assigned to this identifier. */
  confidence?: IdentifierConfidence;
  /** Date from which the identifier is considered valid. */
  validFrom?: Date;
  /** Date until which the identifier is considered valid. */
  validUntil?: Date;
}

/**
 * Regulator registration or participation record.
 */
export interface RegulatoryRegistration {
  /** Regulator or authority name, such as `BCB`. */
  authority: string;
  /** ISO 3166-1 alpha-2 country code of the authority. */
  authorityCountryCode: CountryCode;
  /** Registration category, such as `STR_PARTICIPANT` or `PIX_PARTICIPANT`. */
  registrationType: string;
  /** Registration identifier published by the authority. */
  registrationId?: string;
  /** Operational status for this registration. */
  status?: InstitutionStatus;
  /** Date when the registration started. */
  startedAt?: Date;
  /** Date when the registration ended. */
  endedAt?: Date;
}

/**
 * Traceability reference for data loaded into the institution record.
 */
export interface DataSourceReference {
  /** Source name used internally, such as `BCB_STR_PARTICIPANTS`. */
  sourceName: string;
  /** Public URL or internal reference for the source. */
  sourceUrl?: string;
  /** Timestamp when the source was retrieved. */
  retrievedAt: Date;
  /** Confidence assigned to the source. */
  confidence: IdentifierConfidence;
}

/**
 * Visual metadata used to present the institution in selectors and setup UIs.
 */
export interface FinancialInstitutionBranding {
  /** Public logo URL when the logo is externally hosted. */
  logoUrl?: string | null;
  /** Internal object key when the logo is stored by the application. */
  logoKey?: string | null;
  /** Source or license reference for the logo. */
  logoSource?: string | null;
  /** Main brand color in hex format. */
  brandColor?: string | null;
  /** Indicates whether visual metadata was verified. */
  verified?: boolean;
}

/**
 * Financial institution available for account identification and selection.
 */
export interface FinancialInstitution {
  /** Stable internal identifier, for example `fi_br_ispb_00000000`. */
  _id: string;
  /** Schema.org-compatible top-level type. */
  type: FinancialInstitutionSchemaType;
  /** ISO 3166-1 alpha-2 country code where the institution operates. */
  countryCode: CountryCode;
  /** Official or short name used for search. */
  name: string;
  /** Friendly commercial name shown to users. */
  displayName?: string;
  /** Legal name published by official sources. */
  legalName?: string;
  /** Alternative names and abbreviations used for search. */
  alternateNames?: string[];
  /** Official website URL. */
  url?: string;
  /** Current operational status. */
  status: InstitutionStatus;
  /** Business classification used by the application. */
  institutionType: InstitutionType;
  /** ISO 4217 currencies normally accepted by the institution. */
  defaultCurrencies: CurrencyCode[];
  /** Flexible identifiers used for deduplication and matching. */
  identifiers: FinancialInstitutionIdentifier[];
  /** Regulatory authorizations and participation records. */
  regulatoryRegistrations?: RegulatoryRegistration[];
  /** Optional logo and brand metadata. */
  branding?: FinancialInstitutionBranding;
  /** Source references that explain where the data came from. */
  sources: DataSourceReference[];
  /** Record creation timestamp. */
  createdAt: Date;
  /** Last application update timestamp. */
  updatedAt: Date | null;
  /** Last automated synchronization timestamp. */
  lastSyncedAt?: Date | null;
}

const countryCodeSchema = z.string()
  .length(2)
  .regex(/^[A-Z]{2}$/)
  .describe('ISO 3166-1 alpha-2 country code');

const dateFromStringSchema = z.union([
  z.date(),
  z.string()
    .refine((value) => !Number.isNaN(Date.parse(value)), { message: 'Invalid date format' })
    .transform((value) => new Date(value)),
]);

export const financialInstitutionIdentifierSchema = z.strictObject({
  scheme: z.string().trim().min(1).max(64),
  value: z.string().trim().min(1).max(128),
  issuer: z.string().trim().min(1).max(128).optional(),
  countryCode: countryCodeSchema.optional(),
  primary: z.boolean().optional(),
  confidence: identifierConfidenceSchema.optional(),
  validFrom: dateFromStringSchema.optional(),
  validUntil: dateFromStringSchema.optional(),
});

export const regulatoryRegistrationSchema = z.strictObject({
  authority: z.string().trim().min(1).max(128),
  authorityCountryCode: countryCodeSchema,
  registrationType: z.string().trim().min(1).max(128),
  registrationId: z.string().trim().min(1).max(128).optional(),
  status: institutionStatusSchema.optional(),
  startedAt: dateFromStringSchema.optional(),
  endedAt: dateFromStringSchema.optional(),
});

export const dataSourceReferenceSchema = z.strictObject({
  sourceName: z.string().trim().min(1).max(128),
  sourceUrl: z.string().trim().url().optional(),
  retrievedAt: dateFromStringSchema,
  confidence: identifierConfidenceSchema,
});

export const financialInstitutionBrandingSchema = z.strictObject({
  logoUrl: z.string().trim().url().nullable().optional(),
  logoKey: z.string().trim().min(1).max(512).nullable().optional(),
  logoSource: z.string().trim().min(1).max(512).nullable().optional(),
  brandColor: z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  verified: z.boolean().optional(),
});

export const financialInstitutionSchema = auditableRecordSchema.extend({
  _id: z.nullish(z.string().length(24)),
  type: financialInstitutionSchemaTypeSchema,
  countryCode: countryCodeSchema,
  name: z.string().trim().min(1).max(255),
  displayName: z.string().trim().min(1).max(255).optional(),
  legalName: z.string().trim().min(1).max(255).optional(),
  alternateNames: z.array(z.string().trim().min(1).max(255)).default([]),
  url: z.string().trim().url().optional(),
  status: institutionStatusSchema,
  institutionType: institutionTypeSchema,
  defaultCurrencies: z.array(currencyCodeSchema).min(1),
  identifiers: z.array(financialInstitutionIdentifierSchema).min(1),
  regulatoryRegistrations: z.array(regulatoryRegistrationSchema).default([]),
  branding: financialInstitutionBrandingSchema.optional(),
  sources: z.array(dataSourceReferenceSchema).min(1),
  lastSyncedAt: dateFromStringSchema.nullable().optional(),
});

export const financialInstitutionCreateSchema = financialInstitutionSchema.omit({
  _id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  type: financialInstitutionSchemaTypeSchema.default('BankOrCreditUnion'),
  status: institutionStatusSchema.default('active'),
  alternateNames: z.array(z.string().trim().min(1).max(255)).default([]),
  regulatoryRegistrations: z.array(regulatoryRegistrationSchema).default([]),
});

export const financialInstitutionUpdateSchema = financialInstitutionCreateSchema.partial();

export const financialInstitutionListQuerySchema = z.strictObject({
  countryCode: countryCodeSchema.optional(),
  status: institutionStatusSchema.optional(),
  institutionType: institutionTypeSchema.optional(),
  q: z.string().trim().min(1).max(255).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type FinancialInstitutionData = z.input<typeof financialInstitutionSchema>;
export type FinancialInstitutionCreateData = z.input<typeof financialInstitutionCreateSchema>;
export type FinancialInstitutionCreate = z.infer<typeof financialInstitutionCreateSchema>;
export type FinancialInstitutionUpdateData = z.input<typeof financialInstitutionUpdateSchema>;
export type FinancialInstitutionUpdate = z.infer<typeof financialInstitutionUpdateSchema>;
export type FinancialInstitutionListQuery = z.infer<typeof financialInstitutionListQuerySchema>;
