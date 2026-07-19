type ChallengeType = 'authentication' | 'registration';

class AuthChallengesRepo {
  async consume(attemptId: string, type: ChallengeType): Promise<string> {
    const { db } = await useSecureClient();
    const result = await db.collection('auth_challenges').findOneAndDelete({
      _id: attemptId,
      type,
      expiresAt: { $gt: new Date() },
    });

    if (!result) {
      throw createError({ statusCode: 400, message: 'Challenge expired or already used' });
    }

    return result.challenge as string;
  }

  async store(
    attemptId: string,
    challenge: string,
    type: ChallengeType,
  ): Promise<void> {
    const { db } = await useSecureClient();
    const now = new Date();
    await db.collection('auth_challenges').insertOne({
      _id: attemptId,
      challenge,
      type,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 5 * 60 * 1000),
    });
  }
}

export { AuthChallengesRepo };
export default AuthChallengesRepo;
