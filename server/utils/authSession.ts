import { randomUUID } from 'node:crypto';

import type { UserRecord } from '../repositories/UsersRepo.js';
import type { DeviceDetails } from './device.js';
import type { H3Event } from 'h3';

import AuthSessionsRepo from '../repositories/AuthSessionsRepo.js';

export async function startAuthenticatedSession(
  event: H3Event,
  user: UserRecord,
  credentialId: string,
  device: DeviceDetails,
  authenticatedAt: Date,
): Promise<void> {
  const runtimeConfig = useRuntimeConfig(event);
  const maxAgeSeconds = Number(runtimeConfig.session?.maxAge ?? 4 * 60 * 60);
  const sessionId = randomUUID();

  await new AuthSessionsRepo().insertRecord({
    userId: user._id.toHexString(),
    sessionId,
    credentialId,
    ...device,
    expiresAt: new Date(authenticatedAt.getTime() + maxAgeSeconds * 1000),
  });

  await replaceUserSession(event, {
    user: {
      id: user._id.toHexString(),
      name: user.name,
      email: user.email,
    },
    secure: {
      credentialId,
      sessionId,
    },
    loggedInAt: authenticatedAt.getTime(),
  });
}
