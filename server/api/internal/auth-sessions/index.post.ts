import AuthCredentialsRepo from '~~/server/repositories/AuthCredentialsRepo';
import { authSessionCreateSchema } from '~~/shared/schemas/authSessions';
import AuthSessionsRepo from '~~/server/repositories/AuthSessionsRepo';
import UsersRepo from '~~/server/repositories/UsersRepo';

export default defineEventHandler(async (event) => {
  requireInternalApiAccess(event);

  const body = await readValidatedBody(event, authSessionCreateSchema.parse);
  const user = await new UsersRepo().getRecordById(body.userId);
  if (!user) throw createError({ statusCode: 404, message: 'User not found' });

  const credential = await new AuthCredentialsRepo()
    .findByCredentialId(body.credentialId);
  if (!credential || credential.userId.toHexString() !== body.userId) {
    throw createError({ statusCode: 404, message: 'Passkey not found' });
  }

  const repository = new AuthSessionsRepo();
  const id = await repository.insertRecord(body);
  if (!id) {
    throw createError({ statusCode: 500, message: 'Failed to create auth session' });
  }

  return repository.getRecordById(id);
});
