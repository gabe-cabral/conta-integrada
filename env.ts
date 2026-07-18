import { createEnv } from '@t3-oss/env-nuxt';
import * as z from 'zod';

export const env = createEnv({
  /*
   * Serverside Environment variables, not available on the client.
   * Will throw if you access these variables on the client.
   */
  server: {
    // Nuxt
    NUXT_SESSION_PASSWORD: z
      .string()
      .trim()
      .min(24)
      .max(128)
      .regex(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/),

    // App
    INTERNAL_API_SECRET: z
      .string()
      .trim()
      .min(24)
      .max(128)
      .regex(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/),

    // GCP
    GCP_EMAIL: z.email(),
    GCP_PRIVATE_KEY: z.string().trim().min(100).includes('\n'),

    // MongoDB
    MONGODB_URI: z
      .string()
      .trim()
      .refine((value) => /^(mongodb(?:\+srv)?:\/\/)/i.test(value), {
        message: 'Must start with mongodb:// or mongodb+srv://',
      }),
    MONGODB_DATA_DB: z
      .string()
      .trim()
      .min(5)
      .max(32)
      .regex(/^[A-Za-z0-9_-]+$/),
    MONGODB_CERT_PATH: z
      .string()
      .trim()
      .min(5)
      .regex(/\.pem$/i),
    MONGODB_ADMIN_CERT_PATH: z
      .string()
      .trim()
      .min(5)
      .regex(/\.pem$/i),
    MONGODB_KEY_VAULT_DB_NAME: z
      .string()
      .trim()
      .min(1)
      .max(32)
      .regex(/^[A-Za-z0-9_-]+$/),
    MONGODB_KEY_VAULT_COLLECTION_NAME: z
      .string()
      .trim()
      .min(1)
      .max(32)
      .regex(/^[A-Za-z0-9_-]+$/),
    SHARED_LIB_PATH: z
      .string()
      .trim()
      .min(5)
      .regex(/\.dll$/i),

    // MongoDB Encryption
    KEY_DERIVATION_SECRET: z.string().trim().uuid(),
    MONGODB_GCP_PROJECT_ID: z
      .string()
      .trim()
      .min(6)
      .max(30)
      .regex(/^[a-z][a-z0-9-]+$/),
    MONGODB_CMK_LOCATION: z
      .string()
      .trim()
      .min(3)
      .max(63)
      .refine((value) => {
        const parts = value.split('-');
        return (
          parts.length > 1
          && parts.every((part) => part.length > 0 && /^[a-z0-9]+$/.test(part))
          && /^[a-z]+$/.test(parts[0])
        );
      }, 'Must be a lowercase hyphen-separated location'),
    MONGODB_CMK_KEY_RING: z
      .string()
      .trim()
      .min(1)
      .max(63)
      .regex(/^[A-Za-z0-9_-]+$/),
    MONGODB_CMK_KEY_NAME: z
      .string()
      .trim()
      .min(1)
      .max(63)
      .regex(/^[A-Za-z0-9_-]+$/),
    MONGODB_KMS_PROVIDER_NAME: z
      .string()
      .trim()
      .min(3)
      .max(32)
      .regex(/^[A-Za-z0-9_-]+$/)
      .default('gcp'),

    // Admin
    ADMIN_DOC_VALUE: z
      .string()
      .trim()
      .regex(/^\d{11}$/), // CPF
    ADMIN_NAME: z
      .string()
      .trim()
      .min(3)
      .max(120)
      .regex(/^[\p{L} .'-]{3,120}$/u),
    ADMIN_EMAIL: z.email(),
  },
  /*
   * Environment variables available on the client (and server).
   *
   * 💡 You'll get type errors if these are not prefixed with NUXT_PUBLIC_.
   */
  client: {
    // NUXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  },

  emptyStringAsUndefined: true,
});
