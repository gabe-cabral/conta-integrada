import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import { nuxt as nexsoNuxt } from '@nexso/eslint-config-typescript';
import eslintPluginPrettier from 'eslint-plugin-prettier';

// @ts-check
// eslint-disable-next-line import-x/no-named-as-default
import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt(
  ...nexsoNuxt,
  {
    rules: {
      '@stylistic/max-len': [
        'error',
        {
          code: 100,
          ignoreComments: true,
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreRegExpLiterals: true,
        },
      ],
    },
  },
  {
    plugins: {
      prettier: eslintPluginPrettier,
    },
    rules: {
      // Nuxt and TypeScript resolve aliases such as `~~` and extensionless imports.
      // Requiring `.ts` extensions conflicts with the current TypeScript configuration.
      'import-x/extensions': 'off',
      'n/no-missing-import': 'off',
      '@stylistic/arrow-parens': ['error', 'always'],
    },
  },
  {
    files: ['**/*.vue'],
    rules: {
      'vue/first-attribute-linebreak': [
        'error',
        {
          singleline: 'ignore',
          multiline: 'below',
        },
      ],
      'vue/no-multiple-template-root': 'off',
      'vue/html-self-closing': [
        'error',
        {
          html: {
            void: 'always',
            normal: 'always',
            component: 'always',
          },
          svg: 'always',
          math: 'always',
        },
      ],
      '@stylistic/max-len': 'off',
      'vue/max-len': [
        'error',
        {
          code: 100,
          template: 100,
          tabWidth: 2,
          ignoreComments: true,
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreRegExpLiterals: true,
          ignoreHTMLAttributeValues: true,
        },
      ],
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.vue'],
    settings: {
      'import-x/resolver-next': [
        createTypeScriptImportResolver({
          project: './tsconfig.json',
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.vue'],
        }),
      ],
    },
  },
);
