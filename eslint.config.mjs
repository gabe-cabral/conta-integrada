// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    rules: {
      'vue/first-attribute-linebreak': ['error', {
        singleline: 'ignore',
        multiline: 'beside',
      }],
      'vue/no-multiple-template-root': 'off',
    },
  }
)
