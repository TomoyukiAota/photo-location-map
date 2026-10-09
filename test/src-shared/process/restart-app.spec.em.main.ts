import assert = require('assert');
import { restartApp } from '../../../src-shared/process/restart-app';
import { RequireFromMainProcess } from '../../../src-shared/require/require-from-main-process';

describe('restartApp (in main process)', () => {
  const electron = RequireFromMainProcess.electron;
  afterEach(() => { RequireFromMainProcess.electron = electron; });

  // The real app.quit() would quit the test runner, so a stand-in records the calls.
  it('should relaunch, then quit with app.quit() so that before-quit and will-quit come, not with app.exit()', () => {
    const calls: string[] = [];
    RequireFromMainProcess.electron = {
      app: {
        relaunch: () => calls.push('relaunch'),
        quit: () => calls.push('quit'),
        exit: () => calls.push('exit'),
      },
    } as unknown as typeof import('electron');

    restartApp();

    assert.deepEqual(calls, ['relaunch', 'quit']);
  });
});
