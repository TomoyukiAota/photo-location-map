import assert from 'assert';
import { LogFileConfig } from '../../../src-shared/log/file-config/log-file-config.js';

describe('LogFileConfig (in real Electron renderer)', () => {
  it('rejects setup outside the main process', () => {
    assert.throws(() => LogFileConfig.setup('unused', 'unused', '/'),
      new Error('LogFileConfig can be set up from Electron main process only.'));
  });

  it('is where the main process writes the log, which the startup metadata from the preload says', () => {
    assert.deepStrictEqual(
      { dirName: LogFileConfig.dirName, fileName: LogFileConfig.fileName, filePath: LogFileConfig.filePath },
      window.plm.startup.logFile);
    assert(LogFileConfig.fileName.endsWith('photo-location-map_log.txt'));
  });
});
