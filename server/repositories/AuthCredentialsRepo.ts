import { ObjectId } from 'mongodb';

import type {
  DeleteResult,
  Document,
  Filter,
  OptionalUnlessRequiredId,
  WithId,
} from 'mongodb';
import type { AuthCredential } from '~~/shared/schemas/authCredentials';
import type { WebAuthnCredential } from 'nuxt-auth-utils';

import BaseSecureRepo from './BaseSecureRepo.js';

type AuthCredentialDocument = Omit<AuthCredential, '_id' | 'userId'> & {
  _id?: ObjectId
  userId: ObjectId
} & Document;

export type AuthCredentialRecord = WithId<AuthCredentialDocument>;

export interface AuthCredentialInsert extends WebAuthnCredential {
  userId: string | ObjectId
  browser: string | null
  os: string | null
  platform: string | null
}

class AuthCredentialsRepo extends BaseSecureRepo<
  AuthCredentialRecord,
  AuthCredentialDocument,
  AuthCredentialInsert,
  never,
  string | ObjectId
> {
  constructor() {
    super('auth_credentials');
  }

  async deleteForUser(
    userId: string | ObjectId,
    credentialId: string,
  ): Promise<DeleteResult> {
    const collection = await this.getCollection();
    return collection.deleteOne({
      id: credentialId,
      userId: this.toObjectId(userId),
    });
  }

  async findByCredentialId(
    credentialId: string,
  ): Promise<AuthCredentialRecord | null> {
    const collection = await this.getCollection();
    return this.normalizeCredential(
      await collection.findOne({ id: credentialId }),
    );
  }

  async listByUserId(
    userId: string | ObjectId,
  ): Promise<AuthCredentialRecord[]> {
    const collection = await this.getCollection();
    const credentials = await collection
      .find({ userId: this.toObjectId(userId) })
      .sort({ lastUsedAt: -1, createdAt: -1 })
      .toArray();
    return credentials.map((credential) =>
      this.normalizeCredential(credential)!);
  }

  async markUsed(
    credentialId: string,
    counter: number,
    lastUsedAt: Date,
  ): Promise<void> {
    const collection = await this.getCollection();
    await collection.updateOne(
      { id: credentialId },
      { $set: { counter, lastUsedAt, updatedAt: lastUsedAt } },
    );
  }

  protected override getRecordFilter(
    id: string | ObjectId,
  ): Filter<AuthCredentialDocument> {
    return { _id: this.toObjectId(id) };
  }

  protected override mapDocument(
    record: AuthCredentialInsert,
  ): Promise<OptionalUnlessRequiredId<AuthCredentialDocument>> {
    return Promise.resolve({
      userId: this.toObjectId(record.userId),
      id: record.id,
      publicKey: record.publicKey,
      counter: record.counter,
      backedUp: record.backedUp,
      ...(record.transports ? { transports: record.transports } : {}),
      ...(record.aaguid ? { aaguid: record.aaguid } : {}),
      browser: record.browser,
      os: record.os,
      platform: record.platform,
      lastUsedAt: null,
      createdAt: new Date(),
      updatedAt: null,
    });
  }

  private normalizeCredential(
    credential: AuthCredentialRecord | null,
  ): AuthCredentialRecord | null {
    if (!credential) return null;

    return {
      ...credential,
      transports: credential.transports ?? undefined,
      aaguid: credential.aaguid ?? undefined,
      browser: credential.browser ?? null,
      os: credential.os ?? null,
      platform: credential.platform ?? null,
      lastUsedAt: credential.lastUsedAt ?? null,
      updatedAt: credential.updatedAt ?? null,
    };
  }

  private toObjectId(id: string | ObjectId): ObjectId {
    return id instanceof ObjectId ? id : ObjectId.createFromHexString(id);
  }
}

export { AuthCredentialsRepo };
export default AuthCredentialsRepo;
