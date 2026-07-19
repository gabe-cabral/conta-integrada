import { ObjectId } from 'mongodb';

import type { Document, OptionalUnlessRequiredId, WithId } from 'mongodb';
import type { AuthSessionCreate } from '~~/shared/schemas/authSessions';

import BaseSecureRepo from './BaseSecureRepo.js';

type AuthSessionDocument = Omit<AuthSessionCreate, 'userId'> & {
  _id?: ObjectId
  createdAt: Date
  endedAt: Date | null
  lastSeenAt: Date | null
  updatedAt: Date | null
  userId: ObjectId
} & Document;

export type AuthSessionRecord = WithId<AuthSessionDocument>;

class AuthSessionsRepo extends BaseSecureRepo<
  AuthSessionRecord,
  AuthSessionDocument,
  AuthSessionCreate,
  never,
  string | ObjectId
> {
  constructor() {
    super('auth_sessions');
  }

  async endBySessionId(sessionId: string): Promise<void> {
    const collection = await this.getCollection();
    const now = new Date();
    await collection.updateOne(
      { sessionId, endedAt: null },
      { $set: { endedAt: now, updatedAt: now } },
    );
  }

  async findBySessionId(sessionId: string): Promise<AuthSessionRecord | null> {
    const collection = await this.getCollection();
    return collection.findOne({ sessionId });
  }

  async revokeCredentialSessions(
    userId: string | ObjectId,
    credentialId: string,
  ): Promise<void> {
    const collection = await this.getCollection();
    const now = new Date();
    await collection.updateMany(
      {
        userId: this.toObjectId(userId),
        credentialId,
        endedAt: null,
      },
      { $set: { endedAt: now, updatedAt: now } },
    );
  }

  async revokeUserSessions(userId: string | ObjectId): Promise<void> {
    const collection = await this.getCollection();
    const now = new Date();
    await collection.updateMany(
      { userId: this.toObjectId(userId), endedAt: null },
      { $set: { endedAt: now, updatedAt: now } },
    );
  }

  async touch(sessionId: string): Promise<void> {
    const collection = await this.getCollection();
    const now = new Date();
    await collection.updateOne(
      { sessionId, endedAt: null },
      { $set: { lastSeenAt: now, updatedAt: now } },
    );
  }

  protected override mapDocument(
    record: AuthSessionCreate,
  ): Promise<OptionalUnlessRequiredId<AuthSessionDocument>> {
    return Promise.resolve({
      ...record,
      userId: this.toObjectId(record.userId),
      browser: record.browser ?? null,
      os: record.os ?? null,
      platform: record.platform ?? null,
      lastSeenAt: null,
      endedAt: null,
      createdAt: new Date(),
      updatedAt: null,
    });
  }

  private toObjectId(id: string | ObjectId): ObjectId {
    return id instanceof ObjectId ? id : ObjectId.createFromHexString(id);
  }
}

export { AuthSessionsRepo };
export default AuthSessionsRepo;
