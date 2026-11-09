module.exports = {
  require: [
    './electron-util/isolated-test-profile.js',
    'ts-node/register',
    // The first setups of the app's main process, in its order (src-main/electron-main.ts): the log's location, the
    // startup metadata, and the settings, which are files.
    './src-main/analytics/error-scrubbing-setup.ts',
    './src-main/log/log-setup.ts',
    './src-main/startup/startup-metadata-setup.ts',
    './src-main/user-data-storage/user-data-storage-setup.ts'
  ],
  spec: 'test/**/*.spec.em.@(main|both).ts',
  timeout: 60000,           // Increased from 2000 ms (default) to 60000 ms to avoid "Timeout of 2000ms exceeded" error in GitHub Actions.
};
