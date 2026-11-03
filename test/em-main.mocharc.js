module.exports = {
  require: [
    './electron-util/isolated-test-profile.js',
    'ts-node/register'
  ],
  spec: 'test/**/*.spec.em.@(main|both).ts',
  timeout: 60000,           // Increased from 2000 ms (default) to 60000 ms to avoid "Timeout of 2000ms exceeded" error in GitHub Actions.
};
