import { ObjectId } from 'mongodb';

import type {
  CategoryKind,
  UserCategory,
} from '#shared/schemas/categories.ts';
import type {
  Binary,
} from 'mongodb';

import { normalizeCategoryName } from '#shared/utils/categories.ts';
import { getKeyAltName } from '#server/utils/key-alt-name.ts';

import data from './admin-user-categories.json' with { type: 'json' };
import { getSecureClient } from '../database/client.ts';

const LEGACY_UUID_PATTERN = /^[0-9a-f]{40}$/i;
const COLOR_PATTERN = /^[0-9a-f]{6}$/i;

type LegacyCategoryKind = 'earnings' | 'expenses' | 'none';

interface LegacyUserCategory {
  available: boolean
  color: string
  kind: LegacyCategoryKind
  name: string
  parent_uuid: string | null
  uuid: string
}

type UserCategoryDbDocument = Omit<
  UserCategory,
  '_id' | 'catalogCategoryId' | 'name' | 'parentId' | 'userId'
> & {
  _id: ObjectId
  catalogCategoryId: null
  name: Binary
  nameNormalized: Binary
  parentId: ObjectId | null
  userId: ObjectId
};

if (!Array.isArray(data)) {
  throw new TypeError('Admin user category data is not a list.');
}

const seedCategories = data.map((item) => parseLegacyCategory(item));
validateHierarchy(seedCategories);

async function load(userId: string): Promise<void> {
  if (!ObjectId.isValid(userId)) {
    throw new TypeError('Admin user ID must be a valid ObjectId.');
  }

  const { db, clientEncryption } = await getSecureClient();
  const collection
    = db.collection<UserCategoryDbDocument>('user_categories');
  const userObjectId = ObjectId.createFromHexString(userId);
  const keyAltName = getKeyAltName(userId);
  const createdAt = new Date();
  const resolvedIds = new Map<string, ObjectId>();
  let existingCount = 0;
  let insertedCount = 0;
  let consolidatedCount = 0;
  let repairedParentCount = 0;

  for (const level of ['CATEGORY', 'ACTIVITY'] as const) {
    const levelCategories = seedCategories.filter((category) => (
      level === 'CATEGORY'
        ? category.parent_uuid === null
        : category.parent_uuid !== null
    ));

    for (const category of levelCategories) {
      const parentId = category.parent_uuid
        ? resolvedIds.get(category.parent_uuid)
        : null;

      if (category.parent_uuid && !parentId) {
        throw new Error(
          `Parent ${category.parent_uuid} was not resolved for ${category.uuid}.`,
        );
      }

      const normalizedName = normalizeCategoryName(category.name);
      const kind = mapKind(category.kind);
      const nameNormalized = await clientEncryption.encrypt(normalizedName, {
        algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic',
        keyAltName,
      });
      const expectedId = toObjectId(category.uuid);
      const existingById = await collection.findOne({
        _id: expectedId,
        userId: userObjectId,
      });

      if (existingById) {
        if (
          level === 'ACTIVITY'
          && parentId
          && !existingById.parentId?.equals(parentId)
        ) {
          const existingByName = await collection.findOne({
            userId: userObjectId,
            kind,
            parentId,
            nameNormalized,
          });

          if (existingByName && !existingByName._id.equals(expectedId)) {
            await collection.deleteOne({
              _id: expectedId,
              userId: userObjectId,
            });
            resolvedIds.set(category.uuid, existingByName._id);
            consolidatedCount++;
            existingCount++;
            continue;
          }

          await collection.updateOne(
            { _id: expectedId, userId: userObjectId },
            { $set: { parentId } },
          );
          repairedParentCount++;
        }

        resolvedIds.set(category.uuid, existingById._id);
        existingCount++;
        continue;
      }

      const existingByName = await collection.findOne({
        userId: userObjectId,
        kind,
        parentId,
        nameNormalized,
      });

      if (existingByName) {
        resolvedIds.set(category.uuid, existingByName._id);
        existingCount++;
        continue;
      }

      const document: UserCategoryDbDocument = {
        _id: expectedId,
        userId: userObjectId,
        catalogCategoryId: null,
        parentId,
        name: await clientEncryption.encrypt(category.name, {
          algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Random',
          keyAltName,
        }),
        nameNormalized,
        active: category.available,
        color: `#${category.color.toLowerCase()}`,
        kind,
        level,
        createdAt,
        updatedAt: null,
      };

      await collection.insertOne(document);
      resolvedIds.set(category.uuid, expectedId);
      insertedCount++;
    }
  }

  const unclassifiedCount = seedCategories.filter(
    ({ kind }) => kind === 'none',
  ).length;

  console.log(
    `${insertedCount} categorias do admin inseridas; `
    + `${existingCount} já existiam.`,
  );

  if (repairedParentCount > 0) {
    console.log(
      `${repairedParentCount} atividades tiveram o vínculo com a categoria reparado.`,
    );
  }

  if (consolidatedCount > 0) {
    console.log(
      `${consolidatedCount} atividades duplicadas da carga interrompida foram consolidadas.`,
    );
  }

  if (unclassifiedCount > 0) {
    console.warn(
      `${unclassifiedCount} categorias legadas sem tipo foram carregadas como gastos.`,
    );
  }
}

function mapKind(kind: LegacyCategoryKind): CategoryKind {
  return kind === 'earnings' ? 'INCOME' : 'EXPENSE';
}

function parseLegacyCategory(value: unknown): LegacyUserCategory {
  if (!isLegacyCategory(value)) {
    throw new TypeError('Invalid admin user category seed record.');
  }

  return value;
}

function isLegacyCategory(value: unknown): value is LegacyUserCategory {
  if (!value || typeof value !== 'object') return false;

  const category = value as Record<string, unknown>;

  return (
    typeof category.uuid === 'string'
    && LEGACY_UUID_PATTERN.test(category.uuid)
    && typeof category.name === 'string'
    && category.name.trim().length > 0
    && typeof category.color === 'string'
    && COLOR_PATTERN.test(category.color)
    && typeof category.available === 'boolean'
    && ['earnings', 'expenses', 'none'].includes(String(category.kind))
    && (
      category.parent_uuid === null
      || (
        typeof category.parent_uuid === 'string'
        && LEGACY_UUID_PATTERN.test(category.parent_uuid)
      )
    )
  );
}

function toObjectId(uuid: string): ObjectId {
  return ObjectId.createFromHexString(uuid.slice(0, 24));
}

function validateHierarchy(categories: LegacyUserCategory[]): void {
  const categoryIds = new Set(categories.map(({ uuid }) => uuid));
  const databaseIds = new Set<string>();

  for (const category of categories) {
    const databaseId = toObjectId(category.uuid).toHexString();

    if (databaseIds.has(databaseId)) {
      throw new Error(
        `Legacy UUID collision after ObjectId conversion: ${category.uuid}`,
      );
    }

    databaseIds.add(databaseId);

    if (category.parent_uuid && !categoryIds.has(category.parent_uuid)) {
      throw new Error(
        `Parent ${category.parent_uuid} was not found for ${category.uuid}.`,
      );
    }
  }
}

export { load };
