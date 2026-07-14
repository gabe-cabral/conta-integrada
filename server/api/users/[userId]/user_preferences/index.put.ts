import { z } from 'zod';
import UserPreferencesRepo from '~~/server/repositories/UserPreferencesRepo';
import { userPreferenceUpdateSchema } from '~~/shared/schemas/userPreferences';

const routeSchema = z.strictObject({ userId: z.string().regex(/^[a-fA-F0-9]{24}$/) });

export default defineEventHandler(async (event) => {
  const { userId } = await getValidatedRouterParams(event, routeSchema.parse);
  const { user } = await requireUserSession(event);

  if (user.id !== userId) throw createError({ statusCode: 403, message: 'Forbidden' });

  const changes = await readValidatedBody(event, userPreferenceUpdateSchema.parse);
  const repository = new UserPreferencesRepo();
  const currentPreference = await repository.getByUserId(userId);

  if (!currentPreference) throw createError({ statusCode: 404, message: 'User preferences not found' });

  const nextPreference = { ...currentPreference, ...changes };
  if (!nextPreference.currencies.includes(nextPreference.defaultCurrency)) {
    throw createError({ statusCode: 422, message: 'Default currency must be included in currencies' });
  }

  await repository.updateByUserId(userId, changes);
  return repository.getByUserId(userId);
});
