import stylistic from '@stylistic/eslint-plugin';

export default [{
  files: ['**/*.js'],
  languageOptions: { ecmaVersion: 2022, sourceType: 'commonjs' },
  plugins: { '@stylistic': stylistic },
  rules: {
    '@stylistic/semi': ['error', 'always'],
    '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
  },
}];
