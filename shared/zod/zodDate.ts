import { z } from 'zod';

export const dateStringToDate = z
  .string()
  .refine((date) => !isNaN(Date.parse(date)), { message: 'Invalid date format' })
  .transform((date) => new Date(date));
