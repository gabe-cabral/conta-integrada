import { toUserProfile } from '~~/server/utils/userProfile';
import { z } from 'zod';

const routeSchema = z.strictObject({
  userId: z.string().regex(/^[a-f\d]{24}$/i),
});

export default defineEventHandler(async (event) => {
  const { userId } = await getValidatedRouterParams(event, routeSchema.parse);
  const { user } = await requireUserAccess(event, userId);
  return toUserProfile(user);
});
