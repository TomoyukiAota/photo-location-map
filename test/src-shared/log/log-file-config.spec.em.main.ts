import assert = require('assert');
import { LogFileConfig } from '../../../src-shared/log/file-config/log-file-config';

describe('LogFileConfig (in main process)', () => {
  it('dirName should include application name and "logs"', () => {
    assert(LogFileConfig.dirName.includes('Photo Location Map') === true);
    assert(LogFileConfig.dirName.includes('logs') === true);
  });

  it('fileName should include photo-location-map_log.txt', () => {
    assert(LogFileConfig.fileName.includes('photo-location-map_log.txt') === true);
  });

  it('filePath should include dirName and fileName', () => {
    assert(LogFileConfig.filePath.includes(LogFileConfig.dirName) === true);
    assert(LogFileConfig.filePath.includes(LogFileConfig.fileName) === true);
  });
});
