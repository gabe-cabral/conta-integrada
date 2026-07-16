import { describe, expect, it } from 'vitest';

import isoCodeToCurrency from './isoCodeToCurrency';

describe('isoCodeToCurrency', () => {
  it('deve converter um código ISO em uma moeda para exibição', () => {
    const currency = isoCodeToCurrency('BRL');

    expect(currency.code).toBe('BRL');
    expect(currency.label).toBeTypeOf('string');
    expect(currency.label.length).toBeGreaterThan(0);
    expect(currency.symbol).toBeTypeOf('string');
    expect(currency.symbol.length).toBeGreaterThan(0);
  });

  it('deve rejeitar um código ISO inválido', () => {
    expect(() => isoCodeToCurrency('INVALID')).toThrow(RangeError);
  });
});
