import { LogFileConfig } from './log-file-config';

describe('LogFileConfig (in renderer process)', () => {
  it('setup() should throw an error (because it is unexpected to be called from renderer process)', () => {
    expect(LogFileConfig.setup).toThrow(new Error('LogFileConfig can be set up from Electron main process only.'));
  });

  // Note that dirName, fileName, and filePath are not testable because they need to communicate with main process.
});
