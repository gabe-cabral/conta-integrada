import crypto from 'crypto';
import { env } from '~~/env';

export function getKeyAltName(userId: string): string {
  return crypto
    .createHmac('sha256', env.KEY_DERIVATION_SECRET)
    .update(userId)
    .digest('base64url');
}
