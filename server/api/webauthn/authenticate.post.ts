import AuthCredentialsRepo from '~~/server/repositories/AuthCredentialsRepo';
import AuthChallengesRepo from '~~/server/repositories/AuthChallengesRepo';
import { startAuthenticatedSession } from '~~/server/utils/authSession';
import { getDeviceDetails } from '~~/server/utils/device';
import UsersRepo from '~~/server/repositories/UsersRepo';

export default defineWebAuthnAuthenticateEventHandler({
  async allowCredentials(_event, userName) {
    const user = await new UsersRepo().findByEmail(userName);
    if (!user?.active) {
      throw createError({ statusCode: 400, message: 'Unable to authenticate' });
    }

    const credentials = await new AuthCredentialsRepo().listByUserId(user._id);
    if (!credentials.length) {
      throw createError({ statusCode: 400, message: 'Unable to authenticate' });
    }
    return credentials;
  },

  async getCredential(_event, credentialId) {
    const credential = await new AuthCredentialsRepo()
      .findByCredentialId(credentialId);
    if (!credential) {
      throw createError({ statusCode: 400, message: 'Credential not found' });
    }
    return credential;
  },

  getOptions() {
    return { userVerification: 'required' };
  },

  async storeChallenge(_event, challenge, attemptId) {
    await new AuthChallengesRepo().store(attemptId, challenge, 'authentication');
  },

  async getChallenge(_event, attemptId) {
    return new AuthChallengesRepo().consume(attemptId, 'authentication');
  },

  async onSuccess(event, { credential, authenticationInfo }) {
    const usersRepository = new UsersRepo();
    const user = await usersRepository.getRecordById(credential.userId);
    if (!user?.active) {
      throw createError({ statusCode: 404, message: 'User not found' });
    }

    const authenticatedAt = new Date();
    await Promise.all([
      new AuthCredentialsRepo().markUsed(
        credential.id,
        authenticationInfo.newCounter,
        authenticatedAt,
      ),
      usersRepository.updateLastAccess(user._id, authenticatedAt),
    ]);

    await startAuthenticatedSession(
      event,
      user,
      credential.id,
      getDeviceDetails(event),
      authenticatedAt,
    );
  },
});
