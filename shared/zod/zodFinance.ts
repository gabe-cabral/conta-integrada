import { z } from 'zod';

import type { Money } from '../types/finances.js';

export const MoneySchema = z
  .strictObject({
    amountInCents: z.int().nonnegative(),
    currency: z.string().length(3),
  })
  .transform((data): Money => ({
    amountInCents: data.amountInCents,
    currency: data.currency,
  }));
