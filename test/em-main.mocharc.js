module.exports = {
  require: [
    './electron-util/isolated-test-profile.js',
    'ts-node/register',
    // The main process's settings are its files, as in the app (src-main/electron-main.ts).
    './src-main/user-data-storage/user-data-storage-setup.ts'
  ],
  spec: 'test/**/*.spec.em.@(main|both).ts',
  timeout: 60000,           // Increased from 2000 ms (default) to 60000 ms to avoid "Timeout of 2000ms exceeded" error in GitHub Actions.
};
