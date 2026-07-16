import { nuxt as nexsoNuxt } from '@nexso/eslint-config-typescript';

// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt(
  ...nexsoNuxt,
  {
    rules: {
      'vue/first-attribute-linebreak': [{
        singleline: 'ignore',
        multiline: 'beside',
      }, 'error'],
      'vue/no-multiple-template-root': 'off',
    },
  },
);
