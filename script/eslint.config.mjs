import stylistic from '@stylistic/eslint-plugin';

export default [{
  files: ['**/*.js'],
  languageOptions: { ecmaVersion: 2022, sourceType: 'commonjs' },
  plugins: { '@stylistic': stylistic },
  rules: {
    // Keep the pre-upgrade policy if recommended rules are composed here later.
    'no-unassigned-vars': 'off',
    'no-useless-assignment': 'off',
    'preserve-caught-error': 'off',
    '@stylistic/semi': ['error', 'always'],
    '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
  },
}];
