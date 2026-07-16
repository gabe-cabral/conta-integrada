import type { User } from '#shared/types/user.ts';
import type { Collection } from 'mongodb';

import { getSecureClient } from '../client.ts';

async function setup(): Promise<Collection<User> | null> {
  const { createEncryptedCollection } = await getSecureClient();

  const encryption = await createEncryptedCollection<User>('users', {
    validator: {},
    encryptedFields: {
      fields: [
        {
          path: 'email',
          bsonType: 'string',
          queries: [{ queryType: 'equality' }],
        },
        {
          path: 'name',
          bsonType: 'string',
        },
      ],
    },
  });

  return encryption.collection;
}

export { setup };
