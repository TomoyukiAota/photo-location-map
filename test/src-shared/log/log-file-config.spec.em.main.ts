import assert = require('assert');
import { LogFileConfig } from '../../../src-shared/log/log-file-config';

describe('LogFileConfig (in main process)', () => {
  it('dirName includes application name and "logs"', () => {
    assert(LogFileConfig.dirName.includes('Photo Location Map') === true);
    assert(LogFileConfig.dirName.includes('logs') === true);
  });

  it('fileName includes photo-location-map_log.txt', () => {
    assert(LogFileConfig.fileName.includes('photo-location-map_log.txt') === true);
  });

  it('filePath includes dirName and fileName', () => {
    assert(LogFileConfig.filePath.includes(LogFileConfig.dirName) === true);
    assert(LogFileConfig.filePath.includes(LogFileConfig.fileName) === true);
  });
});
