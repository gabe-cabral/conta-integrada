import type { AnyBulkWriteOperation } from 'mongodb';

import {
  type Currency,
  currencyCreateSchema,
} from '../../shared/schemas/currency.ts';
import { getClient } from '../database/client.ts';

const initialCurrencies = currencyCreateSchema.array().parse([
  {
    _id: 'ARS',
    names: { 'en': 'Argentine peso', 'pt-BR': 'Peso argentino', 'es': 'Peso argentino' },
    symbol: '$',
    numericCode: '032',
    minorUnit: 2,
    countryUsage: [{ countryCode: 'ARG', type: 'official' }],
    active: true,
  },
  {
    _id: 'BOB',
    names: { 'en': 'Boliviano', 'pt-BR': 'Boliviano', 'es': 'Boliviano' },
    symbol: 'Bs.',
    numericCode: '068',
    minorUnit: 2,
    countryUsage: [{ countryCode: 'BOL', type: 'official' }],
    active: true,
  },
  {
    _id: 'BRL',
    names: { 'en': 'Brazilian real', 'pt-BR': 'Real brasileiro', 'es': 'Real brasileño' },
    symbol: 'R$',
    numericCode: '986',
    minorUnit: 2,
    countryUsage: [{ countryCode: 'BRA', type: 'official' }],
    active: true,
  },
  {
    _id: 'CLP',
    names: { 'en': 'Chilean peso', 'pt-BR': 'Peso chileno', 'es': 'Peso chileno' },
    symbol: '$',
    numericCode: '152',
    minorUnit: 0,
    countryUsage: [{ countryCode: 'CHL', type: 'official' }],
    active: true,
  },
  {
    _id: 'COP',
    names: { 'en': 'Colombian peso', 'pt-BR': 'Peso colombiano', 'es': 'Peso colombiano' },
    symbol: '$',
    numericCode: '170',
    minorUnit: 2,
    countryUsage: [{ countryCode: 'COL', type: 'official' }],
    active: true,
  },
  {
    _id: 'EUR',
    names: { 'en': 'Euro', 'pt-BR': 'Euro', 'es': 'Euro' },
    symbol: '€',
    numericCode: '978',
    minorUnit: 2,
    countryUsage: [
      { countryCode: 'AND', type: 'official' },
      { countryCode: 'AUT', type: 'official' },
      { countryCode: 'BEL', type: 'official' },
      { countryCode: 'BGR', type: 'official' },
      { countryCode: 'CYP', type: 'official' },
      { countryCode: 'DEU', type: 'official' },
      { countryCode: 'ESP', type: 'official' },
      { countryCode: 'EST', type: 'official' },
      { countryCode: 'FIN', type: 'official' },
      { countryCode: 'FRA', type: 'official' },
      { countryCode: 'GRC', type: 'official' },
      { countryCode: 'HRV', type: 'official' },
      { countryCode: 'IRL', type: 'official' },
      { countryCode: 'ITA', type: 'official' },
      { countryCode: 'LTU', type: 'official' },
      { countryCode: 'LUX', type: 'official' },
      { countryCode: 'LVA', type: 'official' },
      { countryCode: 'MCO', type: 'official' },
      { countryCode: 'MLT', type: 'official' },
      { countryCode: 'MNE', type: 'official' },
      { countryCode: 'NLD', type: 'official' },
      { countryCode: 'PRT', type: 'official' },
      { countryCode: 'SMR', type: 'official' },
      { countryCode: 'SVK', type: 'official' },
      { countryCode: 'SVN', type: 'official' },
      { countryCode: 'VAT', type: 'official' },
    ],
    active: true,
  },
  {
    _id: 'JPY',
    names: { 'en': 'Japanese yen', 'pt-BR': 'Iene japonês', 'es': 'Yen japonés' },
    symbol: '¥',
    numericCode: '392',
    minorUnit: 0,
    countryUsage: [{ countryCode: 'JPN', type: 'official' }],
    active: true,
  },
  {
    _id: 'PEN',
    names: { 'en': 'Peruvian sol', 'pt-BR': 'Sol peruano', 'es': 'Sol peruano' },
    symbol: 'S/',
    numericCode: '604',
    minorUnit: 2,
    countryUsage: [{ countryCode: 'PER', type: 'official' }],
    active: true,
  },
  {
    _id: 'PYG',
    names: { 'en': 'Paraguayan guaraní', 'pt-BR': 'Guarani paraguaio', 'es': 'Guaraní paraguayo' },
    symbol: '₲',
    numericCode: '600',
    minorUnit: 0,
    countryUsage: [{ countryCode: 'PRY', type: 'official' }],
    active: true,
  },
  {
    _id: 'USD',
    names: { 'en': 'United States dollar', 'pt-BR': 'Dólar dos Estados Unidos', 'es': 'Dólar estadounidense' },
    symbol: '$',
    numericCode: '840',
    minorUnit: 2,
    countryUsage: [
      { countryCode: 'ASM', type: 'official' },
      { countryCode: 'BES', type: 'official' },
      { countryCode: 'ECU', type: 'official' },
      { countryCode: 'FSM', type: 'official' },
      { countryCode: 'GUM', type: 'official' },
      { countryCode: 'MHL', type: 'official' },
      { countryCode: 'MNP', type: 'official' },
      { countryCode: 'PAN', type: 'officialParallel' },
      { countryCode: 'PLW', type: 'official' },
      { countryCode: 'PRI', type: 'official' },
      { countryCode: 'SLV', type: 'official' },
      { countryCode: 'TCA', type: 'official' },
      { countryCode: 'TLS', type: 'official' },
      { countryCode: 'USA', type: 'official' },
      { countryCode: 'VIR', type: 'official' },
    ],
    active: true,
  },
  {
    _id: 'UYU',
    names: { 'en': 'Uruguayan peso', 'pt-BR': 'Peso uruguaio', 'es': 'Peso uruguayo' },
    symbol: '$U',
    numericCode: '858',
    minorUnit: 2,
    countryUsage: [{ countryCode: 'URY', type: 'official' }],
    active: true,
  },
  {
    _id: 'VES',
    names: {
      'en': 'Venezuelan sovereign bolívar',
      'pt-BR': 'Bolívar soberano venezuelano',
      'es': 'Bolívar soberano venezolano',
    },
    symbol: 'Bs.',
    numericCode: '928',
    minorUnit: 2,
    countryUsage: [{ countryCode: 'VEN', type: 'official' }],
    active: true,
  },
]);

/**
 * Inserts the base currency catalog without overwriting currency data maintained
 * through the internal API.
 */
async function load(): Promise<void> {
  const { db } = await getClient();
  const collection = db.collection<Currency>('currency');
  const operations: AnyBulkWriteOperation<Currency>[] = initialCurrencies.map(currency => ({
    updateOne: {
      filter: { _id: currency._id },
      update: { $setOnInsert: currency },
      upsert: true,
    },
  }));

  const result = await collection.bulkWrite(operations, { ordered: false });
  const existingCount = initialCurrencies.length - result.upsertedCount;

  console.log(`${result.upsertedCount} currencies inserted; ${existingCount} already existed.`);
}

export { initialCurrencies, load };
