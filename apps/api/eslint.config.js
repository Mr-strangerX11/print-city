// @ts-check
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');

/** @type {import('eslint').Linter.FlatConfig[]} */
module.exports = [
  {
    files: ['src/**/*.ts', 'apps/**/*.ts', 'libs/**/*.ts', 'test/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs['recommended'].rules,
      // Disabled to match tsconfig noImplicitAny: false — project intentionally uses any
      '@typescript-eslint/no-explicit-any': 'off',
      // Demoted to warning so pre-existing unused vars don't block CI
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  },
];
