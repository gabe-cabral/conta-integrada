import AuthCredentialsRepo from '~~/server/repositories/AuthCredentialsRepo';
import AuthSessionsRepo from '~~/server/repositories/AuthSessionsRepo';
import { z } from 'zod';

const routeSchema = z.strictObject({
  userId: z.string().regex(/^[a-f\d]{24}$/i),
  credentialId: z.string().min(1).max(1024),
});

export default defineEventHandler(async (event) => {
  const { userId, credentialId } = await getValidatedRouterParams(
    event,
    routeSchema.parse,
  );
  const { session } = await requireUserAccess(event, userId);

  if (session.secure?.credentialId === credentialId) {
    throw createError({
      statusCode: 409,
      message: 'The passkey used by the current session cannot be removed',
    });
  }

  const result = await new AuthCredentialsRepo().deleteForUser(
    userId,
    credentialId,
  );
  if (result.deletedCount === 0) {
    throw createError({ statusCode: 404, message: 'Passkey not found' });
  }

  await new AuthSessionsRepo().revokeCredentialSessions(userId, credentialId);

  setResponseStatus(event, 204);
  return null;
});
