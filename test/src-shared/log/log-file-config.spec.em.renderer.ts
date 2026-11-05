import assert = require('assert');
import { LogFileConfig } from '../../../src-shared/log/file-config/log-file-config';

describe('LogFileConfig (in real Electron renderer)', () => {
  it('rejects setup outside the main process', () => {
    assert.throws(() => LogFileConfig.setup('unused', 'unused'),
      new Error('LogFileConfig can be set up from Electron main process only.'));
  });
});
