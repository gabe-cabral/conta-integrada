import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import { nuxt as nexsoNuxt } from '@nexso/eslint-config-typescript';
import eslintPluginPrettier from 'eslint-plugin-prettier';

// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt(
  ...nexsoNuxt,
  {
    plugins: {
      prettier: eslintPluginPrettier,
    },
    rules: {
      // Força o ESLint a apontar erros onde o Prettier não está formatado
      'prettier/prettier': [
        'error',
        {
          trailingComma: 'all',
          tabWidth: 2,
          semi: true,
          singleQuote: true,
          printWidth: 100,
          bracketSpacing: true,
          arrowParens: 'always',
          endOfLine: 'lf',
          vueIndentScriptAndStyle: false,
        },
      ],
    },
  },
  {
    rules: {
      'vue/first-attribute-linebreak': [
        'error',
        {
          singleline: 'ignore',
          multiline: 'below',
        },
      ],
      'vue/no-multiple-template-root': 'off',
    },
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
