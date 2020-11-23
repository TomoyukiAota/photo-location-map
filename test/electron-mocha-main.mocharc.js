module.exports = {
  require: [
    './test/electron-mocha-main.hooks.js',
    'espower-typescript/guess'
  ],
  spec: 'test/**/*.spec.em.@(main|both).ts',
  timeout: 60000,           // Increased from 2000 ms (default) to 60000 ms to avoid "Timeout of 2000ms exceeded" error in GitHub Actions.
};
