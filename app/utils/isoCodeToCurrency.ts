import type { Currency } from '~~/shared/types/finances';

function isoCodeToCurrency(code: string): Currency {
  const parts = new Intl.NumberFormat(undefined, { style: 'currency', currency: code })
    .formatToParts(0);
  
  const symbol = parts.find((part) => part.type === 'currency')?.value ?? code;
  const label = new Intl.DisplayNames(undefined, { type: 'currency' }).of(code) ?? code;

  return { code, label, symbol };
}

export default isoCodeToCurrency;
