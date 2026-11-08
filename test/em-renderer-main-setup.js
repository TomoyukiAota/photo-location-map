// The main process of electron-mocha's renderer tests: the app's isolated test profile and the main-process side of
// the IPC that the tested renderer code uses, from the app's own sources.
require('../electron-util/isolated-test-profile');
require('ts-node').register({ transpileOnly: true, project: require('node:path').join(__dirname, 'em-main.tsconfig.json') });
require('../src-main/startup/startup-metadata-ipc-setup');
require('../src-main/exif/exif-ipc-setup');
