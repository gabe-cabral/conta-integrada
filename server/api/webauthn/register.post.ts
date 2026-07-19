import AuthCredentialsRepo from '~~/server/repositories/AuthCredentialsRepo';
import AuthChallengesRepo from '~~/server/repositories/AuthChallengesRepo';
import { startAuthenticatedSession } from '~~/server/utils/authSession';
import { getDeviceDetails } from '~~/server/utils/device';
import UsersRepo from '~~/server/repositories/UsersRepo';
import { z } from 'zod';

const registrationUserSchema = z.strictObject({
  userName: z.string().trim().toLowerCase().email().max(320),
  displayName: z.string().trim().min(2).max(150).optional(),
  initialPin: z.string().regex(/^\d{6,12}$/).optional(),
});
export default defineWebAuthnRegisterEventHandler({
  async validateUser(userBody, event) {
    const body = registrationUserSchema.parse(userBody);
    const usersRepository = new UsersRepo();
    const user = await usersRepository.findByEmail(body.userName);
    const session = await getUserSession(event);

    if (!user?.active) {
      throw createError({ statusCode: 400, message: 'Unable to register passkey' });
    }

    if (session.user?.id === user._id.toHexString()) return body;

    if (
      !body.initialPin
      || !user.initialPinHash
      || !(await verifyPassword(user.initialPinHash, body.initialPin))
    ) {
      throw createError({ statusCode: 400, message: 'Unable to register passkey' });
    }

    return body;
  },

  async excludeCredentials(_event, userName) {
    const user = await new UsersRepo().findByEmail(userName);
    if (!user) return [];
    return new AuthCredentialsRepo().listByUserId(user._id);
  },

  getOptions() {
    return {
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'required',
      },
    };
  },

  async storeChallenge(_event, challenge, attemptId) {
    await new AuthChallengesRepo().store(attemptId, challenge, 'registration');
  },

  async getChallenge(_event, attemptId) {
    return new AuthChallengesRepo().consume(attemptId, 'registration');
  },

  async onSuccess(event, { credential, user }) {
    const usersRepository = new UsersRepo();
    const dbUser = await usersRepository.findByEmail(user.userName);

    if (!dbUser?.active) {
      throw createError({ statusCode: 404, message: 'User not found' });
    }

    const device = getDeviceDetails(event);
    await new AuthCredentialsRepo().insertRecord({
      ...credential,
      userId: dbUser._id,
      ...device,
    });

    const authenticatedAt = new Date();
    await Promise.all([
      usersRepository.clearInitialPin(dbUser._id),
      usersRepository.updateLastAccess(dbUser._id, authenticatedAt),
    ]);
    await startAuthenticatedSession(
      event,
      dbUser,
      credential.id,
      device,
      authenticatedAt,
    );
  },
});
