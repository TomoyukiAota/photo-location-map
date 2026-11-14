import assert from 'assert';
import { app } from 'electron';
import * as os from 'os';
import * as path from 'path';
import { createStartupMetadata, systemLanguagesOf } from '../../../src-main/startup/startup-metadata-setup.js';
import { LogFileConfig } from '../../../src-shared/log/file-config/log-file-config.js';
import { startupMetadata } from '../../../src-shared/startup/startup-metadata.js';

describe('startupMetadata (in main process)', () => {
  it('gives what the renderer needs to know of the app, the computer and the test profile', () => {
    const standIn = {
      getVersion: () => '9.9.9-test', getPath: (name: string) => `/data/${name}`, getPreferredSystemLanguages: () => ['ja-JP', 'en-US'],
    } as unknown as Electron.App;
    const metadata = createStartupMetadata(standIn, { PLM_E2E: '1' });
    assert.deepStrictEqual(metadata, {
      ...metadata,
      version: '9.9.9-test',
      userDataPath: '/data/userData',
      platform: process.platform,
      systemLanguages: ['ja-JP', 'en-US'],
      pathSeparator: path.sep,
      homeDir: os.homedir(),
      isE2e: true,
      logFile: { dirName: LogFileConfig.dirName, fileName: LogFileConfig.fileName, filePath: LogFileConfig.filePath },
    });
    assert.strictEqual(createStartupMetadata(standIn, {}).isE2e, false);
    assert.strictEqual(createStartupMetadata(standIn, { PLM_E2E: 'yes' }).isE2e, false);
  });

  it('gives the operating system\'s languages, and in a test only what the test asks for', () => {
    const standIn = { getPreferredSystemLanguages: () => ['ja-JP', 'en-US'] };
    assert.deepStrictEqual(systemLanguagesOf(standIn, {}), ['ja-JP', 'en-US']);
    // A test profile, as the e2e suite's, and the unit tests of either process.
    for (const test of [{ PLM_TEST_ROOT: '/profile' }, { PLM_EM_MAIN: 'true' }, { PLM_EM_RENDERER: 'true' }]) {
      assert.deepStrictEqual(systemLanguagesOf(standIn, test), ['en-US']);
      assert.deepStrictEqual(systemLanguagesOf(standIn, { ...test, PLM_TEST_SYSTEM_LANGUAGES: 'ja-JP' }), ['ja-JP']);
      assert.deepStrictEqual(systemLanguagesOf(standIn, { ...test, PLM_TEST_SYSTEM_LANGUAGES: ' fr-CA , ja ,' }), ['fr-CA', 'ja']);
      assert.deepStrictEqual(systemLanguagesOf(standIn, { ...test, PLM_TEST_SYSTEM_LANGUAGES: '' }), ['en-US']);
    }
    // Without a test profile, the variable is not read.
    assert.deepStrictEqual(systemLanguagesOf(standIn, { PLM_TEST_SYSTEM_LANGUAGES: 'fr' }), ['ja-JP', 'en-US']);
  });

  it('is set at the start of the main process, for the real app, as the main window gets it', () => {
    assert.deepStrictEqual(startupMetadata(), createStartupMetadata(app, process.env));
  });
});
