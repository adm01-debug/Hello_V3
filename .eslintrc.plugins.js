module.exports = {
  extends: ['plugin:import/recommended'],
  plugins: ['import', 'unused-imports'],
  rules: {
    'import/order': ['error', {
      groups: ['builtin', 'external', 'internal', ['parent', 'sibling']],
      'newlines-between': 'always',
      alphabetize: { order: 'asc' }
    }],
    'unused-imports/no-unused-imports': 'error'
  }
};
