import { toUserProfile } from '~~/server/utils/userProfile';
import { userCreateSchema } from '~~/shared/schemas/users';
import UsersRepo from '~~/server/repositories/UsersRepo';

export default defineEventHandler(async (event) => {
  requireInternalApiAccess(event);

  const body = await readValidatedBody(event, userCreateSchema.parse);
  const initialPinHash = await hashPassword(body.initialPin);
  const repository = new UsersRepo();

  try {
    const id = await repository.insertRecord({
      email: body.email,
      name: body.name,
      initialPinHash,
    });

    if (!id) {
      throw createError({ statusCode: 500, message: 'Failed to create user' });
    }

    const user = await repository.getRecordById(id);
    if (!user) {
      throw createError({ statusCode: 500, message: 'Failed to load created user' });
    }

    return toUserProfile(user);
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      throw createError({ statusCode: 409, message: error.message });
    }
    throw error;
  }
});
