import { z } from 'zod';
import UserPreferencesRepo from '~~/server/repositories/UserPreferencesRepo';

const routeSchema = z.strictObject({ userId: z.string().regex(/^[a-fA-F0-9]{24}$/) });

export default defineEventHandler(async (event) => {
  const { userId } = await getValidatedRouterParams(event, routeSchema.parse);
  const { user } = await requireUserSession(event);

  if (user.id !== userId) throw createError({ statusCode: 403, message: 'Forbidden' });

  const preference = await new UserPreferencesRepo().getByUserId(userId);
  if (!preference) throw createError({ statusCode: 404, message: 'User preferences not found' });

  return preference;
});
