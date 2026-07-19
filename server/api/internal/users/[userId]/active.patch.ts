import AuthSessionsRepo from '~~/server/repositories/AuthSessionsRepo';
import { userActivationSchema } from '~~/shared/schemas/users';
import { toUserProfile } from '~~/server/utils/userProfile';
import UsersRepo from '~~/server/repositories/UsersRepo';
import { z } from 'zod';

const routeSchema = z.strictObject({
  userId: z.string().regex(/^[a-f\d]{24}$/i),
});

export default defineEventHandler(async (event) => {
  requireInternalApiAccess(event);

  const { userId } = await getValidatedRouterParams(event, routeSchema.parse);
  const { active } = await readValidatedBody(event, userActivationSchema.parse);
  const usersRepository = new UsersRepo();
  const result = await usersRepository.setActive(userId, active);

  if (result.matchedCount === 0) {
    throw createError({ statusCode: 404, message: 'User not found' });
  }

  if (!active) {
    await new AuthSessionsRepo().revokeUserSessions(userId);
  }

  const user = await usersRepository.getRecordById(userId);
  if (!user) throw createError({ statusCode: 404, message: 'User not found' });
  return toUserProfile(user);
});
