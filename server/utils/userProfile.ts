import { createHash } from 'node:crypto';

import type { UserRecord } from '../repositories/UsersRepo.js';

export function toUserProfile(user: UserRecord) {
  const emailHash = createHash('sha256')
    .update(user.email.trim().toLowerCase())
    .digest('hex');

  return {
    _id: user._id.toHexString(),
    name: user.name,
    email: user.email,
    active: user.active,
    avatarUrl: `https://www.gravatar.com/avatar/${emailHash}?d=404&s=160`,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastAccessAt: user.lastAccessAt,
  };
}
