import { createError } from 'h3';

import type { H3Event } from 'h3';

import UsersRepo from '../repositories/UsersRepo.js';

export async function requireUserAccess(event: H3Event, userId: string) {
  const session = await requireUserSession(event);
  if (session.user.id !== userId) {
    throw createError({ statusCode: 403, message: 'Forbidden' });
  }

  const user = await new UsersRepo().getRecordById(userId);
  if (!user || !user.active) {
    throw createError({ statusCode: 401, message: 'User account is inactive' });
  }

  return { session, user };
}
