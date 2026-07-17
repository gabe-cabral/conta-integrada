import type { WebAuthnCredential } from 'nuxt-auth-utils';
import type { User } from '~~/shared/types/user';
import type { WithId } from 'mongodb';

export default defineWebAuthnAuthenticateEventHandler({
  // Optionally, we can prefetch the credentials if the user gives their userName during login
  async allowCredentials(event, userName) {
    const { db } = await useSecureClient();
    const user = await db.collection<User>('users').findOne({ email: userName });

    if (!user) {
      throw createError({ statusCode: 404, message: 'User not found' });
    }

    const credentials = await db
      .collection<WithId<WebAuthnCredential>>('auth_credentials')
      .find({ userId: user._id })
      .toArray();

    // If no credentials are found, the authentication cannot be completed
    if (!credentials.length) throw createError({ statusCode: 400, message: 'User not found' });

    // If user is found, only allow credentials that are registered
    // The browser will automatically try to use the credential that it knows about
    // Skipping the step for the user to select a credential for a better user experience
    return credentials;
    // example: [{ id: '...' }]
  },

  async getCredential(event, credentialId) {
    // Look for the credential in our database
    const db = await useDatabase();
    const credential = await db
      .collection<WithId<WebAuthnCredential>>('auth_credentials')
      .findOne({ id: credentialId });

    // If the credential is not found, there is no account to log in to
    if (!credential) throw createError({ statusCode: 400, message: 'Credential not found' });

    return credential;
  },

  // async storeChallenge(event, challenge, attemptId) {
  //   const db = await useDatabase()
  //   const coll = db.collection('webauthn_authentication_attempts')

  //   await coll.insertOne({
  //     attemptId,
  //     challenge,
  //     createdAt: new Date(),
  //   })
  // },

  // async getChallenge(event, attemptId) {
  //   const db = await useDatabase()
  //   const coll = db.collection('webauthn_authentication_attempts')
  //   const challenge = await coll.findOne({ attemptId })

  //   // Make sure to always remove the attempt because they are single use only!
  //   await coll.deleteOne({ attemptId })

  //   if (!challenge)
  //     throw createError({ statusCode: 400, message: 'Challenge expired' })

  //   return challenge._id.toHexString();
  // },

  async onSuccess(event, { credential, authenticationInfo }) {
    // The credential authentication has been successful
    // We can look it up in our database and get the corresponding user
    const { db } = await useSecureClient();
    const user = await db
      .collection<WithId<Omit<User, '_id'>>>('users')
      .findOne({ _id: credential.userId! });

    if (!user) {
      throw createError({ statusCode: 404, message: 'User not found' });
    }

    // Update the counter in the database (authenticationInfo.newCounter)
    await db
      .collection('auth_credentials')
      .updateOne({ id: credential.id }, { $set: { counter: authenticationInfo.newCounter } });

    // Set the user session
    await setUserSession(event, {
      user: {
        id: user?._id.toHexString(),
        name: user?.name,
      },
      secure: {},
      loggedInAt: Date.now(),
    });
  },
});
