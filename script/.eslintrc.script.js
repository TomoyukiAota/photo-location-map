module.exports = {
  env: {
    'node': true,
    'es2022': true,
  },
  parserOptions: {
    'ecmaVersion': 13,
  },
  rules: {
    semi: ['error', 'always'],
    quotes: ['error', 'single', { 'avoidEscape': true }],
  }
};
