import {
  buildExchangeRateSnapshotId,
  normalizeUtcDayStart,
} from '~~/shared/schemas/exchangeRateSnapshots';
import { Decimal128 } from 'mongodb';
import Decimal from 'decimal.js';

import type {
  ExchangeRateSnapshotCreate,
  ExchangeRateSnapshotDto,
} from '~~/shared/schemas/exchangeRateSnapshots';
import type { CurrencyCode } from '~~/shared/schemas/currency';

export type ExchangeRateSnapshotDocument = Omit<ExchangeRateSnapshotDto, 'rates'> & {
  rates: Record<CurrencyCode, Decimal128>
};

export function decimalStringToDecimal128(value: string): Decimal128 {
  const trimmed = value.trim();
  const decimal = new Decimal(trimmed);

  if (!decimal.isFinite() || !decimal.isPositive()) {
    throw new Error('Rate must be a positive finite decimal string');
  }

  return Decimal128.fromString(trimmed);
}

export function decimal128ToString(value: Decimal128): string {
  return value.toString();
}

export function mapRatesToDecimal128(
  rates: Record<CurrencyCode, string>,
): Record<CurrencyCode, Decimal128> {
  return Object.fromEntries(
    Object.entries(rates).map(([currency, rate]) => [currency, decimalStringToDecimal128(rate)]),
  ) as Record<CurrencyCode, Decimal128>;
}

export function mapRatesToDto(
  rates: Record<CurrencyCode, Decimal128>,
): Record<CurrencyCode, string> {
  return Object.fromEntries(
    Object.entries(rates).map(([currency, rate]) => [currency, decimal128ToString(rate)]),
  ) as Record<CurrencyCode, string>;
}

export function mapSnapshotCreateToDocument(
  snapshot: ExchangeRateSnapshotCreate,
  createdAt: Date,
  updatedAt: Date,
): ExchangeRateSnapshotDocument {
  const valuationDate = normalizeUtcDayStart(snapshot.valuationDate);
  const provider: ExchangeRateSnapshotDocument['provider'] = {
    name: snapshot.provider.name,
    retrievedAt: snapshot.provider.retrievedAt,
  };

  if (snapshot.provider.referenceDate) {
    provider.referenceDate = normalizeUtcDayStart(snapshot.provider.referenceDate);
  }

  if (snapshot.provider.timestamp) {
    provider.timestamp = snapshot.provider.timestamp;
  }

  return {
    ...snapshot,
    _id: buildExchangeRateSnapshotId(snapshot.baseCurrency, valuationDate),
    valuationDate,
    rates: mapRatesToDecimal128(snapshot.rates),
    provider,
    expectedCurrencies: snapshot.expectedCurrencies ?? [],
    missingCurrencies: snapshot.missingCurrencies ?? [],
    createdAt,
    updatedAt,
  };
}

export function mapSnapshotDocumentToDto(
  document: ExchangeRateSnapshotDocument,
): ExchangeRateSnapshotDto {
  return {
    ...document,
    rates: mapRatesToDto(document.rates),
  };
}
