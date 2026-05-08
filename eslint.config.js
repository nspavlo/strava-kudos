const js = require('@eslint/js')
const globals = require('globals')

module.exports = [
  {
    languageOptions: {
      globals: globals.node,
    },
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'script',
      globals: {
        ...globals.browser,
        chrome: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
    },
  },
]
