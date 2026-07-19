import { z } from 'zod';

import { userAuditableRecordWithIdSchema } from '../zod/zodBase.js';

const optionalDateSchema = z.union([z.date(), z.string().pipe(z.coerce.date())]).nullable();

export const authSessionSchema = userAuditableRecordWithIdSchema.extend({
  sessionId: z.string().min(1).max(512),
  credentialId: z.string().min(1).max(1024),
  browser: z.string().max(150).nullable(),
  os: z.string().max(150).nullable(),
  platform: z.string().max(50).nullable(),
  lastSeenAt: optionalDateSchema,
  expiresAt: z.union([z.date(), z.string().pipe(z.coerce.date())]),
  endedAt: optionalDateSchema,
});

export const authSessionCreateSchema = z.strictObject({
  userId: z.string().regex(/^[a-f\d]{24}$/i),
  sessionId: z.string().min(1).max(512),
  credentialId: z.string().min(1).max(1024),
  browser: z.string().max(150).nullable().optional(),
  os: z.string().max(150).nullable().optional(),
  platform: z.string().max(50).nullable().optional(),
  expiresAt: z.union([z.date(), z.string().pipe(z.coerce.date())]),
});

export type AuthSession = z.infer<typeof authSessionSchema>;
export type AuthSessionCreate = z.infer<typeof authSessionCreateSchema>;
