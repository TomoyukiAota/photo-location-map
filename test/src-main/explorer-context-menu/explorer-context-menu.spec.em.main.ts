import assert = require('assert');
import childProcess = require('child_process');
import path = require('path');
import {
  addExplorerContextMenu, afterPreviousChange, explorerContextMenuKeys, explorerContextMenuValues, regExePath,
  RegFailure, removeExplorerContextMenu, runReg,
} from '../../../src-main/explorer-context-menu/explorer-context-menu';
import { Logger } from '../../../src-shared/log/logger';

const exePath = 'C:\\Users\\Someone\\AppData\\Local\\Programs\\Photo Location Map\\Photo Location Map.exe';
const fileKey = 'HKCU\\Software\\Classes\\*\\shell\\OpenWithPhotoLocationMap';
const folderKey = 'HKCU\\Software\\Classes\\Directory\\shell\\OpenWithPhotoLocationMap';
const backgroundKey = 'HKCU\\Software\\Classes\\Directory\\Background\\shell\\OpenWithPhotoLocationMap';
/** What Remove asks reg.exe when a key could not be deleted and is not there, to know that reg.exe works at all. */
const queryOfAKeyThatIsAlwaysThere = ['query', 'HKCU\\Software', '/ve'];

/** A stand-in for reg.exe that records each run, and fails the runs that `fails` picks. */
function fakeReg(fails: (args: readonly string[]) => boolean = () => false) {
  const runs: string[][] = [];
  const run = async (args: readonly string[]) => {
    runs.push([...args]);
    if (fails(args)) throw new Error(`reg.exe ${args[0]} failed`);
  };
  return { runs, run };
}

describe('Explorer context menu (in main process)', () => {
  it('writes, for files, folders and the background of a folder, the label, the icon and a command with the exe quoted', () => {
    assert.deepEqual(explorerContextMenuKeys, [fileKey, folderKey, backgroundKey]);
    assert.deepEqual(explorerContextMenuValues(exePath), [
      { key: fileKey, name: null, data: 'Open with &Photo Location Map' },
      { key: fileKey, name: 'icon', data: exePath },
      { key: `${fileKey}\\command`, name: null, data: `"${exePath}" --open "%1"` },
      { key: folderKey, name: null, data: 'Open with &Photo Location Map' },
      { key: folderKey, name: 'icon', data: exePath },
      { key: `${folderKey}\\command`, name: null, data: `"${exePath}" --open "%1"` },
      { key: backgroundKey, name: null, data: 'Open with &Photo Location Map' },
      { key: backgroundKey, name: 'icon', data: exePath },
      { key: `${backgroundKey}\\command`, name: null, data: `"${exePath}" --open "%V"` },
    ]);
  });

  it('adds each value with reg.exe, in order', async () => {
    const reg = fakeReg();
    await addExplorerContextMenu(exePath, reg.run);
    assert.deepEqual(reg.runs, explorerContextMenuValues(exePath).map(({ key, name, data }) =>
      ['add', key, ...(name === null ? ['/ve'] : ['/v', name]), '/t', 'REG_SZ', '/d', data, '/f']));
  });

  it('stops adding at the first failure, and fails', async () => {
    const reg = fakeReg(args => args[1] === folderKey);
    await assert.rejects(addExplorerContextMenu(exePath, reg.run), /reg\.exe add failed/);
    assert.equal(reg.runs.length, 4);
  });

  it('deletes the three keys with reg.exe', async () => {
    const reg = fakeReg();
    await removeExplorerContextMenu(reg.run);
    assert.deepEqual(reg.runs, explorerContextMenuKeys.map(key => ['delete', key, '/f']));
  });

  it('removes the keys that are there, leaving out one that is not', async () => {
    // reg.exe fails both to delete and to query a key that is not there, and still queries one that is.
    const reg = fakeReg(args => args[1] === folderKey);
    await removeExplorerContextMenu(reg.run);
    assert.deepEqual(reg.runs, [
      ['delete', fileKey, '/f'],
      ['delete', folderKey, '/f'], ['query', folderKey], queryOfAKeyThatIsAlwaysThere,
      ['delete', backgroundKey, '/f'],
    ]);
  });

  it('fails to remove when a key that could not be deleted is still there', async () => {
    const reg = fakeReg(args => args[0] === 'delete' && args[1] === folderKey);
    await assert.rejects(removeExplorerContextMenu(reg.run), /reg\.exe delete failed/);
    assert.deepEqual(reg.runs[reg.runs.length - 1], ['query', folderKey]);
  });

  it('fails to remove when reg.exe does not work at all, as when it cannot start or the registry tools are blocked', async () => {
    const reg = fakeReg(() => true);
    await assert.rejects(removeExplorerContextMenu(reg.run), /reg\.exe delete failed/);
    assert.deepEqual(reg.runs, [['delete', fileKey, '/f'], ['query', fileKey], queryOfAKeyThatIsAlwaysThere]);
  });

  it('makes a change wait until the previous one has finished, whether it worked or not', async () => {
    const runs: string[] = [];
    const run = async (args: readonly string[]) => {
      runs.push(args[0]);
      await new Promise(resolve => setImmediate(resolve));
    };
    // Remove is asked for while Add is still writing, as by a click on Remove right after one on Add.
    await Promise.all([
      afterPreviousChange(() => addExplorerContextMenu(exePath, run)),
      afterPreviousChange(() => removeExplorerContextMenu(run)),
    ]);
    assert.deepEqual(runs, [...Array(9).fill('add'), ...Array(3).fill('delete')]);
    await assert.rejects(afterPreviousChange(() => Promise.reject(new Error('An earlier change failed'))));
    assert.equal(await afterPreviousChange(async () => 'the next change'), 'the next change');
  });

  it('writes to the log what failed, on which key, with what reg.exe wrote', async () => {
    const logged: string[] = [];
    // Logged, not recorded: the failure is recorded as its own event ([Registry] … Error).
    const original = Logger.errorNotRecorded;
    const failOn = (key: string) => async (args: readonly string[]) => {
      if (args[1] === key) throw Object.assign(new Error(`reg.exe ${args[0]} failed (exit code 1)`), { key, output: 'ERROR: Access is denied.' });
    };
    try {
      (Logger as { errorNotRecorded: unknown }).errorNotRecorded = (message: string) => logged.push(message);
      await assert.rejects(addExplorerContextMenu(exePath, failOn(folderKey)));
      // The key is still there, as the query that follows the failed delete finds.
      await assert.rejects(removeExplorerContextMenu(args => args[0] === 'delete' ? failOn(backgroundKey)(args) : Promise.resolve()));
    } finally {
      (Logger as { errorNotRecorded: unknown }).errorNotRecorded = original;
    }
    assert.deepEqual(logged, [
      `[Registry] Failed to add the registry keys for the Explorer's context menu: Error: reg.exe add failed (exit code 1): ${folderKey}: ERROR: Access is denied.`,
      `[Registry] Failed to delete the registry keys for the Explorer's context menu: Error: reg.exe delete failed (exit code 1): ${backgroundKey}: ERROR: Access is denied.`,
    ]);
  });

  it('keeps what reg.exe wrote, as text when it is UTF-8, and in hex otherwise, as in the code page of Japanese Windows', async () => {
    const original = childProcess.execFile;
    const failures: RegFailure[] = [];
    // "エラー" in Shift_JIS, which is not UTF-8.
    for (const stderr of [Buffer.from('ERROR: Access is denied.\r\n'), Buffer.from([0x83, 0x47, 0x83, 0x89, 0x81, 0x5b])]) {
      try {
        (childProcess as { execFile: unknown }).execFile = (_file: string, _args: readonly string[], _options: unknown,
          callback: (error: Error | null, stdout: Buffer, stderr: Buffer) => void) =>
          callback(Object.assign(new Error('Command failed'), { code: 1 }), Buffer.alloc(0), stderr);
        await runReg(['delete', folderKey, '/f']).catch((error: RegFailure) => failures.push(error));
      } finally {
        (childProcess as { execFile: unknown }).execFile = original;
      }
    }
    assert.deepEqual(failures.map(failure => [failure.message, failure.key, failure.output]), [
      ['reg.exe delete failed (exit code 1)', folderKey, 'ERROR: Access is denied.'],
      ['reg.exe delete failed (exit code 1)', folderKey, '(not UTF-8, in hex) 83478389815b'],
    ]);
  });

  it('runs the reg.exe of Windows by its full path, without a console window', async () => {
    assert.ok(path.win32.isAbsolute(regExePath), regExePath);
    assert.match(regExePath, /\\System32\\reg\.exe$/);
    const original = childProcess.execFile;
    const calls: { file: string, args: readonly string[], options: childProcess.ExecFileOptions }[] = [];
    try {
      (childProcess as { execFile: unknown }).execFile = (file: string, args: readonly string[],
        options: childProcess.ExecFileOptions, callback: (error: Error | null, stdout: string, stderr: string) => void) => {
        calls.push({ file, args, options });
        callback(null, '', '');
      };
      await runReg(['query', fileKey]);
    } finally {
      (childProcess as { execFile: unknown }).execFile = original;
    }
    assert.deepEqual(calls.map(call => [call.file, call.args, call.options.windowsHide]), [[regExePath, ['query', fileKey], true]]);
  });

  describe('with the real reg.exe, under a key of its own', function() {
    // Explorer reads none of this key; it is deleted afterwards.
    const testKey = `HKCU\\Software\\PhotoLocationMap-Test-${process.pid}`;
    before(function() {
      if (process.platform !== 'win32') this.skip();
    });
    after(() => {
      if (process.platform === 'win32') childProcess.spawnSync(regExePath, ['delete', testKey, '/f'], { windowsHide: true });
    });

    it('writes a value with quotation marks and %1 as it is', async () => {
      const data = `"${exePath}" --open "%1"`;
      await runReg(['add', `${testKey}\\command`, '/ve', '/t', 'REG_SZ', '/d', data, '/f']);
      const query = childProcess.spawnSync(regExePath, ['query', `${testKey}\\command`, '/ve'], { encoding: 'utf8', windowsHide: true });
      assert.equal(query.status, 0, query.stderr);
      // The name of the default value is in the language of Windows, so read only what follows its type.
      assert.equal(query.stdout.match(/ {4}REG_SZ {4}(.*)$/m)?.[1], data);
    });

    it('fails both to delete and to query a key that is not there, with what reg.exe wrote, and queries one that is', async () => {
      await assert.rejects(runReg(['delete', `${testKey}\\Missing`, '/f']), (error: RegFailure) => {
        assert.equal(error.message, 'reg.exe delete failed (exit code 1)');
        assert.equal(error.key, `${testKey}\\Missing`);
        assert.ok(error.output, 'what reg.exe wrote');
        return true;
      });
      await assert.rejects(runReg(['query', `${testKey}\\Missing`]), /^Error: reg\.exe query failed \(exit code 1\)$/);
      await runReg(queryOfAKeyThatIsAlwaysThere);
    });
  });
});
