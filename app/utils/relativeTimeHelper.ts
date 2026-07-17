function relativeTimeHelper(date: Date): string {
  const diffMs = date.getTime() - Date.now();

  const units = [
    { unit: 'day', ms: 1000 * 60 * 60 * 24 },
    { unit: 'hour', ms: 1000 * 60 * 60 },
    { unit: 'minute', ms: 1000 * 60 },
    { unit: 'month', ms: 1000 * 60 * 60 * 24 * 30 },
    { unit: 'second', ms: 1000 },
    { unit: 'year', ms: 1000 * 60 * 60 * 24 * 365 },
  ] as { ms: number; unit: Intl.RelativeTimeFormatUnit }[];

  const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });

  for (const { unit, ms } of units) {
    const value = diffMs / ms;
    if (Math.abs(value) > 1) {
      return rtf.format(Math.round(value), unit);
    }
  }

  return rtf.format(0, 'second');
}

export default relativeTimeHelper;
