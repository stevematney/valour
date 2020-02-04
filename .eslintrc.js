module.exports = {
  extends: ['eslint:recommended', 'plugin:prettier/recommended'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  env: {
    es2020: true,
    node: true
  },
  rules: {
    semi: [2, 'always']
  },
  settings: {
    react: { version: 'detect' }
  },
  overrides: [
    {
      files: ['test/*.js', '**/*.test.ts'],
      env: { mocha: true, jest: true },
      extends: ['plugin:jest/recommended']
    },
    {
      files: ['**/*.ts'],
      parser: '@typescript-eslint/parser',
      extends: [
        'plugin:@typescript-eslint/recommended',
        'prettier/@typescript-eslint'
      ]
    }
  ]
};
