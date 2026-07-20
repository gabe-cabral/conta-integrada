import { fileURLToPath } from 'node:url';

import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';

import { env } from './env';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/hints',
    '@nuxt/image',
    '@nuxt/scripts',
    '@pinia/nuxt',
    'nuxt-auth-utils',
    '@nuxtjs/i18n',
  ],
  imports: {
    dirs: ['shared/schemas', 'shared/utils'],
  },
  css: [
    '@/assets/styles/bootstrap.scss',
    '@/assets/styles/icons.scss',
    '@/assets/styles/main.scss',
  ],

  runtimeConfig: {
    internalApiSecret: env.INTERNAL_API_SECRET || '',
    session: {
      name: 'nuxt-session',
      password: env.NUXT_SESSION_PASSWORD || 'supersecret',
      maxAge: 4 * 60 * 60, // 4 hours,
      cookie: {
        sameSite: 'lax',
      },
    },
    mongoDb: {
      uri: env.MONGODB_URI || '',
      dbName: env.MONGODB_DATA_DB || 'conta-integrada-dev',
      certPath: env.MONGODB_CERT_PATH || '',
      kmsProviderName: env.MONGODB_KMS_PROVIDER_NAME || 'gcp',
      keyVaultDatabaseName: env.MONGODB_KEY_VAULT_DB_NAME || 'encryption',
      keyVaultCollectionName: env.MONGODB_KEY_VAULT_COLLECTION_NAME || 'keyVault',
      gcp: {
        email: env.GCP_EMAIL,
        privateKey: env.GCP_PRIVATE_KEY,
        cmkProjectId: env.MONGODB_GCP_PROJECT_ID,
        cmkLocation: env.MONGODB_CMK_LOCATION,
        cmkKeyRing: env.MONGODB_CMK_KEY_RING,
        cmkKeyName: env.MONGODB_CMK_KEY_NAME,
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

  i18n: {
    defaultLocale: 'pt-BR',
    strategy: 'no_prefix',
    baseUrl: env.BASE_URL,
    differentDomains: env.NODE_ENV === 'production',
    locales: [
      {
        code: 'pt-BR',
        iso: 'pt-BR',
        name: 'Português',
        file: 'pt-BR.ts',
        language: 'pt-BR',
        domain: 'containtegrada.com.br',
        domainDefault: true,
      },
      {
        code: 'en',
        iso: 'en-US',
        name: 'English',
        file: 'en.ts',
        language: 'en-US',
        domain: 'allinoneaccounts.au',
      },
      {
        code: 'es-CO',
        iso: 'es-CO',
        name: 'Español (Colombia)',
        files: ['es.ts', 'es-CO.ts'],
        language: 'es-CO',
        domain: 'cuentaintegrada.co',
      },
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'essential.i18n_redirected',
      redirectOn: 'root',
    },
  },

  routeRules: {
    '/': { swr: 60, cache: { varies: ['host'] } },
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
          additionalData: [
            '@import "@/assets/styles/variables.scss";',
            '@import "@modules/bootstrap/scss/_functions.scss";',
            '@import "@modules/bootstrap/scss/_mixins.scss";',
            '@import "@modules/bootstrap/scss/_variables.scss";',
          ].join(' '),
          silenceDeprecations: ['color-functions', 'global-builtin', 'if-function', 'import'],
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
    optimizeDeps: {
      include: ['@vue/devtools-core', '@vue/devtools-kit', 'bootstrap', 'tom-select', 'zod'],
    },
  },
});
