import assert = require('assert');
import { relaunchAndQuit } from '../../../src-shared/process/restart-app';

describe('relaunchAndQuit (in main process)', () => {
  // The real app.quit() would quit the test runner, so a stand-in records the calls.
  it('should relaunch, then quit with app.quit() so that before-quit and will-quit come, not with app.exit()', () => {
    const calls: string[] = [];
    const app = {
      relaunch: () => calls.push('relaunch'),
      quit: () => calls.push('quit'),
      exit: () => calls.push('exit'),
    } as unknown as Electron.App;

    relaunchAndQuit(app);

    assert.deepEqual(calls, ['relaunch', 'quit']);
  });
});
