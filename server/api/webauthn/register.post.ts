import { z } from 'zod';

export default defineWebAuthnRegisterEventHandler({
  // optional
  async validateUser(userBody, event) {
    // bonus: check if the user is already authenticated to link a credential to his account
    // We first check if the user is already authenticated by getting the session
    // And verify that the email is the same as the one in session
    const session = await getUserSession(event);

    if (session.user?.id && session.user.id !== userBody.userName) {
      throw createError({ statusCode: 400, message: 'Email not matching curent session' });
    }

    // If he registers a new account with credentials
    return z.object({
      // we want the userName to be a valid email
      userName: z.string().email(),
    }).parse(userBody);
  },

  async onSuccess(event, { credential, user }) {
    // The credential creation has been successful
    // We need to create a user if it does not exist
    const db = await useDatabase();
    const coll = db.collection('users');

    // Get the user from the database
    let dbUser = await coll.findOne({ email: user.userName });

    if (!dbUser) {
      // Store new user in database & its credentials
      const result = await coll.insertOne({
        email: user.userName,
        createdAt: new Date(),
      });

      dbUser = await coll.findOne({ _id: result.insertedId });
    }

    if (!dbUser) {
      throw createError({ statusCode: 404, message: 'User not found' });
    }

    // we now need to store the credential in our database and link it to the user
    await db.collection('auth_credentials').insertOne({
      userId: dbUser._id,
      id: credential.id,
      publicKey: credential.publicKey,
      counter: credential.counter,
      backedUp: credential.backedUp,
      transports: credential.transports,
      createdAt: new Date(),
    });

    // Set the user session
    await setUserSession(event, {
      user: {
        id: dbUser._id.toHexString(),
        name: dbUser?.name,
      },
      loggedInAt: Date.now(),
    });
  },
});
