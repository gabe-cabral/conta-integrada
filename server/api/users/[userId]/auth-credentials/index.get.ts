import AuthCredentialsRepo from '~~/server/repositories/AuthCredentialsRepo';
import { z } from 'zod';

const routeSchema = z.strictObject({
  userId: z.string().regex(/^[a-f\d]{24}$/i),
});

export default defineEventHandler(async (event) => {
  const { userId } = await getValidatedRouterParams(event, routeSchema.parse);
  const { session } = await requireUserAccess(event, userId);
  const credentials = await new AuthCredentialsRepo().listByUserId(userId);

  return credentials.map((credential) => ({
    _id: credential._id.toHexString(),
    id: credential.id,
    backedUp: credential.backedUp,
    transports: credential.transports,
    aaguid: credential.aaguid,
    browser: credential.browser,
    os: credential.os,
    platform: credential.platform,
    lastUsedAt: credential.lastUsedAt,
    createdAt: credential.createdAt,
    current: session.secure?.credentialId === credential.id,
  }));
});
