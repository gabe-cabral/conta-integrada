import { ObjectId } from 'mongodb';
import z from 'zod';

const routeSchema = z.object({
  userId: z.string().length(24),
});

export default defineEventHandler(async (event) => {
  const params = await getValidatedRouterParams(event, routeSchema.parse);

  const { user } = await requireUserSession(event);

  if (user.id !== params!.userId) {
    throw createError({ statusCode: 403, message: 'Forbidden' });
  }

  const { db } = await useSecureClient();
  const collection = db.collection('categories');

  return collection.find({ userId: ObjectId.createFromHexString(user.id) }).toArray();
});
