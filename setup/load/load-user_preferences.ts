import { ObjectId } from 'mongodb';

import type { UserPreference, UserPreferenceCreate } from '#shared/schemas/userPreferences.ts';

import { getClient } from '../database/client.ts';

async function load(userId: string): Promise<void> {
  const { db } = await getClient();
  const preference: UserPreferenceCreate = {
    userId: ObjectId.createFromHexString(userId),
    createdAt: new Date(),
    updatedAt: null,
    defaultCurrency: 'BRL',
    currencies: ['BRL', 'COP', 'EUR', 'USD'],
  };

  const result = await db
    .collection<UserPreference>('user_preferences')
    .updateOne({ userId: preference.userId }, { $setOnInsert: preference }, { upsert: true });

  console.log(
    result.upsertedCount
      ? 'Preferências do usuário inseridas.'
      : 'Preferências do usuário já existem.',
  );
}

export { load };
