import { fileURLToPath } from 'node:url';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxt/eslint', '@nuxt/hints', '@nuxt/fonts', '@nuxt/scripts', '@pinia/nuxt', '@nuxt/image', 'nuxt-auth-utils'],
  imports: {
    dirs: ['shared/schemas', 'shared/utils'],
  },
  css: [
    '@/assets/styles/bootstrap.scss',
    '@/assets/styles/main.scss',
    '@/assets/styles/icons.scss',
  ],

  runtimeConfig: {
    session: {
      name: 'nuxt-session',
      password: process.env.NUXT_SESSION_PASSWORD || 'supersecret',
      maxAge: 4 * 60 * 60, // 4 hours,
      cookie: {
        sameSite: 'lax'
      },
    },
    mongoDb: {
      uri: process.env.MONGODB_URI || '',
      dbName: process.env.MONGODB_DATA_DB || 'conta-integrada-dev',
      certPath: process.env.MONGODB_CERT_PATH || '',
      kmsProviderName: process.env.MONGODB_KMS_PROVIDER_NAME || 'gcp',
      keyVaultDatabaseName: process.env.MONGODB_KEY_VAULT_DB_NAME || 'encryption',
      keyVaultCollectionName: process.env.MONGODB_KEY_VAULT_COLLECTION_NAME || 'keyVault',
      gcp: {
        email: process.env.MONGODB_GCP_EMAIL,
        privateKey: process.env.MONGODB_GCP_PRIVATE_KEY,
        cmkProjectId: process.env.MONGODB_GCP_PROJECT_ID,
        cmkLocation: process.env.MONGODB_CMK_LOCATION,
        cmkKeyRing: process.env.MONGODB_CMK_KEY_RING,
        cmkKeyName: process.env.MONGODB_CMK_KEY_NAME,
      },
    },
  },

  auth: {
    webAuthn: true,
  },

  app: {
    baseURL: '/',
    head: {
      title: 'Conta Integrada',
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/png', href: '/favicon-96x96.png', sizes: '96x96' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'shortcut icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
        // { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        // { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
        // { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Ubuntu:ital,wght@0,300;0,400;0,500;0,700;1,400&display=swap', media: 'print', onload: 'this.media=\'all\'' },
      ],
    },
  },

  vite: {
    resolve: {
      alias: {
        '@modules': fileURLToPath(new URL('./node_modules', import.meta.url)),
      },
    },
    plugins: [
      ViteImageOptimizer({
        includePublic: true,
        svg: {
          multipass: true,
          plugins: [
            {
              name: 'preset-default',
              params: {
                overrides: {
                  cleanupNumericValues: false,
                  cleanupIds: {
                    minify: false,
                    remove: true,
                  },
                  convertPathData: false,
                },
              },
            },
            'sortAttrs',
            {
              name: 'addAttributesToSVGElement',
              params: {
                attributes: [{ xmlns: 'http://www.w3.org/2000/svg' }],
              },
            },
          ],
        },
        png: { quality: 90 },
        jpeg: { quality: 80 },
        jpg: { quality: 80 },
        webp: { lossless: true },
      }),
    ],
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@import "@modules/bootstrap/scss/_functions.scss"; @import "@/assets/styles/variables.scss"; @import "@modules/bootstrap/scss/_variables.scss"; @import "@modules/bootstrap/scss/_mixins.scss";',
          silenceDeprecations: ['global-builtin', 'import', 'color-functions', 'if-function'],
        },
      },
    },
    build: {
      cssCodeSplit: true,
      sourcemap: true,
      rollupOptions: {
        input: {
          bs: '@/assets/styles/bootstrap.scss',
          icons: '@/assets/styles/icons.scss',
          main: '@/assets/styles/main.scss',
        },
      },
    },
  },
})
