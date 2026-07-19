import AuthSessionsRepo from '../repositories/AuthSessionsRepo.js';
import UsersRepo from '../repositories/UsersRepo.js';

export default defineNitroPlugin(() => {
  sessionHooks.hook('fetch', async (session) => {
    if (!session.user?.id) return;

    const trackedSessionId = session.secure?.sessionId;
    const [user, authSession] = await Promise.all([
      new UsersRepo().getRecordById(session.user.id),
      trackedSessionId
        ? new AuthSessionsRepo().findBySessionId(trackedSessionId)
        : Promise.resolve(null),
    ]);
    const now = new Date();

    if (
      !user?.active
      || !authSession
      || authSession.endedAt
      || authSession.expiresAt <= now
    ) {
      throw createError({ statusCode: 401, message: 'Session is no longer active' });
    }

    await new AuthSessionsRepo().touch(trackedSessionId!);
  });

  sessionHooks.hook('clear', async (session) => {
    if (session.secure?.sessionId) {
      await new AuthSessionsRepo().endBySessionId(session.secure.sessionId);
    }
  });
});
