import assert from 'assert';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { relaunchAndQuit, relaunchAppImageAfter } from '../../../src-main/process/relaunch-and-quit.js';

describe('relaunchAndQuit (in main process)', () => {
  // The real app.quit() would quit the test runner, so a stand-in records the calls.
  it('should relaunch, then quit with app.quit() so that before-quit and will-quit come, not with app.exit()', () => {
    const calls: string[] = [];
    const app = {
      relaunch: () => calls.push('relaunch'),
      quit: () => calls.push('quit'),
      exit: () => calls.push('exit'),
    } as unknown as Electron.App;

    relaunchAndQuit(app, ''); // Not from an AppImage.

    assert.deepEqual(calls, ['relaunch', 'quit']);
  });

  it('should leave an AppImage to start itself again, with the app\'s arguments, then quit', () => {
    const calls: unknown[] = [];
    const app = { relaunch: () => calls.push('relaunch'), quit: () => calls.push('quit') } as unknown as Electron.App;

    relaunchAndQuit(app, '/home/user/Photo Location Map.AppImage', (appImage, args) => calls.push({ appImage, args }));

    assert.deepEqual(calls, [{ appImage: '/home/user/Photo Location Map.AppImage', args: process.argv.slice(1) }, 'quit']);
  });
});

describe('relaunchAppImageAfter (in main process)', () => {
  it('starts the AppImage with its arguments once the process has ended, not before', async function () {
    if (process.platform === 'win32') this.skip(); // An AppImage is for Linux, and Windows has no /bin/sh.
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'plm-relaunch-'));
    try {
      // A stand-in for the AppImage, which writes the arguments it got.
      const started = path.join(root, 'started.txt');
      const appImage = path.join(root, 'Photo Location Map.AppImage');
      fs.writeFileSync(appImage, `#!/bin/sh\nprintf '%s\\n' "$@" > "${started}.part"\nmv "${started}.part" "${started}"\n`, { mode: 0o755 });
      // A stand-in for the app that quits.
      const app = spawn('/bin/sh', ['-c', 'sleep 0.5']);
      const endedAt = new Promise<number>(resolve => app.once('exit', () => resolve(Date.now())));

      relaunchAppImageAfter(appImage, ['--open', 'a # b', ''], { pid: app.pid });

      let startedAt: number | undefined;
      for (const deadline = Date.now() + 10000; Date.now() < deadline && startedAt === undefined;) {
        await new Promise(resolve => setTimeout(resolve, 20));
        if (fs.existsSync(started)) startedAt = Date.now();
      }
      assert.ok(startedAt !== undefined, 'The AppImage was not started.');
      assert.ok(startedAt >= await endedAt, 'The AppImage was started before the app ended.');
      assert.deepStrictEqual(fs.readFileSync(started, 'utf8').split('\n'), ['--open', 'a # b', '', '']);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('gives up, starting nothing, when the process outlives the wait', async function () {
    if (process.platform === 'win32') this.skip(); // An AppImage is for Linux, and Windows has no /bin/sh.
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'plm-relaunch-'));
    const app = spawn('/bin/sh', ['-c', 'sleep 3']);
    try {
      const started = path.join(root, 'started.txt');
      const appImage = path.join(root, 'Photo Location Map.AppImage');
      fs.writeFileSync(appImage, `#!/bin/sh\ntouch "${started}"\n`, { mode: 0o755 });

      relaunchAppImageAfter(appImage, [], { pid: app.pid, waitSeconds: 0.5 });

      await new Promise(resolve => app.once('exit', resolve));
      await new Promise(resolve => setTimeout(resolve, 500)); // As long as the shell would take to start it.
      assert.strictEqual(fs.existsSync(started), false, 'The AppImage was started after the wait had ended.');
    } finally {
      app.kill();
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
