import { z } from 'zod';

import { userAuditableRecordWithIdSchema } from '../zod/zodBase.js';

export const authenticatorTransportSchema = z.enum([
  'ble',
  'cable',
  'hybrid',
  'internal',
  'nfc',
  'smart-card',
  'usb',
]);

const optionalDateSchema = z.union([z.date(), z.string().pipe(z.coerce.date())]).nullable();

export const authCredentialSchema = userAuditableRecordWithIdSchema.extend({
  id: z.string().min(1).max(1024),
  publicKey: z.string().min(1),
  counter: z.number().int().nonnegative(),
  backedUp: z.boolean(),
  transports: z.array(authenticatorTransportSchema).optional(),
  aaguid: z.string().max(128).optional(),
  browser: z.string().max(150).nullable(),
  os: z.string().max(150).nullable(),
  platform: z.string().max(50).nullable(),
  lastUsedAt: optionalDateSchema,
});

export type AuthCredential = z.infer<typeof authCredentialSchema>;

export type AuthCredentialSummary = Omit<
  AuthCredential,
  'counter' | 'publicKey' | 'updatedAt' | 'userId'
> & {
  current: boolean
};
