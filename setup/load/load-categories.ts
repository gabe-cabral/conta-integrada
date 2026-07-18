import { ObjectId } from 'mongodb';

import type { TransactionCategory } from '#shared/types/transactions.ts';
import type { Binary } from 'mongodb';

import { getKeyAltName } from '#server/utils/key-alt-name.ts';

import data from './conta-integrada-dev.categories.json' with { type: 'json' };
import { getSecureClient } from '../database/client.ts';

interface TransactionCategoryDb extends Omit<
  TransactionCategory,
  'name' | '_id' | 'parentId' | 'userId'
> {
  name: Binary
  _id: ObjectId
  parentId: ObjectId | null
  userId: ObjectId
}

async function load(userId: string) {
  if (!Array.isArray(data)) throw new Error('Data is not a list.');

  const { db, clientEncryption } = await getSecureClient();
  const coll = db.collection<TransactionCategoryDb>('categories');
  const keyAltName = getKeyAltName(userId);
  const documents: TransactionCategoryDb[] = [];

  async function mapData(d: TransactionCategory): Promise<TransactionCategoryDb> {
    return {
      ...d,
      name: await clientEncryption.encrypt(d.name, {
        algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Random',
        keyAltName,
      }),
      _id: ObjectId.createFromHexString(d._id),
      parentId: d.parentId ? ObjectId.createFromHexString(d.parentId) : null,
      userId: ObjectId.createFromHexString(userId),
    };
  }

  for await (const item of data) {
    const doc = await mapData(item as TransactionCategory);
    documents.push(doc);
  }

  const result = await coll.insertMany(documents);

  console.log(`✅ ${result.insertedCount} categorias inseridas.`);
}

export { load };
