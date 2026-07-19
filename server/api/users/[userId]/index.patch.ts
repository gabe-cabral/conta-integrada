import { toUserProfile } from '~~/server/utils/userProfile';
import { userUpdateSchema } from '~~/shared/schemas/users';
import UsersRepo from '~~/server/repositories/UsersRepo';
import { z } from 'zod';

const routeSchema = z.strictObject({
  userId: z.string().regex(/^[a-f\d]{24}$/i),
});

export default defineEventHandler(async (event) => {
  const { userId } = await getValidatedRouterParams(event, routeSchema.parse);
  const { user } = await requireUserAccess(event, userId);
  const changes = await readValidatedBody(event, userUpdateSchema.parse);
  const repository = new UsersRepo();
  const result = await repository.updateRecord(userId, changes);

  if (result.matchedCount === 0) {
    throw createError({ statusCode: 404, message: 'User not found' });
  }

  const updatedUser = await repository.getRecordById(userId);
  if (!updatedUser) throw createError({ statusCode: 404, message: 'User not found' });

  await setUserSession(event, {
    user: {
      id: userId,
      name: updatedUser.name,
      email: user.email,
    },
  });

  return toUserProfile(updatedUser);
});
