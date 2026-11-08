import assert = require('assert');
import { app } from 'electron';
import * as os from 'os';
import * as path from 'path';
import { createStartupMetadata } from '../../../src-main/startup/startup-metadata-setup';
import { LogFileConfig } from '../../../src-shared/log/file-config/log-file-config';
import { startupMetadata } from '../../../src-shared/startup/startup-metadata';

describe('startupMetadata (in main process)', () => {
  it('gives what the renderer needs to know of the app, the computer and the test profile', () => {
    const standIn = { getVersion: () => '9.9.9-test', getPath: (name: string) => `/data/${name}` } as unknown as Electron.App;
    const metadata = createStartupMetadata(standIn, { PLM_E2E: '1' });
    assert.deepStrictEqual(metadata, {
      ...metadata,
      version: '9.9.9-test',
      userDataPath: '/data/userData',
      platform: process.platform,
      pathSeparator: path.sep,
      homeDir: os.homedir(),
      isE2e: true,
      logFile: { dirName: LogFileConfig.dirName, fileName: LogFileConfig.fileName, filePath: LogFileConfig.filePath },
    });
    assert.strictEqual(createStartupMetadata(standIn, {}).isE2e, false);
    assert.strictEqual(createStartupMetadata(standIn, { PLM_E2E: 'yes' }).isE2e, false);
  });

  it('is set at the start of the main process, for the real app, as the main window gets it', () => {
    assert.deepStrictEqual(startupMetadata(), createStartupMetadata(app, process.env));
  });
});
