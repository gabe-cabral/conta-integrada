import { z } from 'zod';

import { auditableRecordSchema } from '../zod/zodBase.js';
import { zodObjectId } from '../zod/mongodb.js';

const optionalDateSchema = z.union([z.date(), z.string().pipe(z.coerce.date())]).nullable();

export const userSchema = auditableRecordSchema.extend({
  _id: zodObjectId,
  email: z.string().trim().toLowerCase().email().max(320),
  name: z.string().trim().min(2).max(150),
  active: z.boolean(),
  lastAccessAt: optionalDateSchema,
});

export const userCreateSchema = z.strictObject({
  email: z.string().trim().toLowerCase().email().max(320),
  name: z.string().trim().min(2).max(150),
  initialPin: z.string().regex(/^\d{6,12}$/, 'PIN must contain 6 to 12 digits'),
});

export const userUpdateSchema = z
  .strictObject({
    name: z.string().trim().min(2).max(150).optional(),
  })
  .refine((changes) => Object.keys(changes).length > 0, {
    message: 'At least one user field must be provided',
  });

export const userActivationSchema = z.strictObject({
  active: z.boolean(),
});

export type UserCreate = z.infer<typeof userCreateSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;
export type UserActivation = z.infer<typeof userActivationSchema>;
