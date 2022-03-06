module.exports = {
  env: {
    'node': true,
    'es6': true,
  },
  parserOptions: {
    'ecmaVersion': 2017
  },
  rules: {
    semi: ['error', 'always'],
    quotes: ['error', 'single', { 'avoidEscape': true }],
  }
};
