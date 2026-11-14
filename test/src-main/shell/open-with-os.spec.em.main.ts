import assert from 'assert';
import childProcess from 'child_process';
import { syncBuiltinESMExports } from 'module';
import {
  commandToOpenContainingFolder, commandToOpenWithAssociatedApp, isWebPageUrl, openContainingFolder, openWithAssociatedApp
} from '../../../src-main/shell/open-with-os.js';

describe('open-with-os (in main process)', () => {
  // A file name may hold characters that a shell would run: they must stay in one argument.
  const posixPath = '/photos/a "b" $(touch pwned) `id` c.jpg';
  const windowsPath = 'C:\\photos\\a b %USERPROFILE% & c.jpg';

  it('opens with the associated app without a shell, the path as one argument', () => {
    assert.deepStrictEqual(commandToOpenWithAssociatedApp(posixPath, 'darwin'), { file: 'open', args: [posixPath], windowsVerbatimArguments: false });
    assert.deepStrictEqual(commandToOpenWithAssociatedApp(posixPath, 'linux'), { file: 'xdg-open', args: [posixPath], windowsVerbatimArguments: false });
    // Explorer reads its own command line: `explorer "<path>"`, as the shell gave it.
    assert.deepStrictEqual(commandToOpenWithAssociatedApp(windowsPath, 'win32'), { file: 'explorer', args: [`"${windowsPath}"`], windowsVerbatimArguments: true });
    assert.strictEqual(commandToOpenWithAssociatedApp(posixPath, 'aix'), null);
  });

  it('opens the containing folder without a shell, the path as one argument', () => {
    assert.deepStrictEqual(commandToOpenContainingFolder(posixPath, 'darwin'), { file: 'open', args: ['-R', posixPath], windowsVerbatimArguments: false });
    assert.deepStrictEqual(commandToOpenContainingFolder(posixPath, 'linux'), { file: 'nautilus', args: [posixPath], windowsVerbatimArguments: false });
    assert.deepStrictEqual(commandToOpenContainingFolder(windowsPath, 'win32'), { file: 'explorer', args: [`/select,"${windowsPath}"`], windowsVerbatimArguments: true });
    assert.strictEqual(commandToOpenContainingFolder(posixPath, 'aix'), null);
  });

  it('runs the command without a shell, and handles a program that cannot be run', () => {
    // open-with-os.ts reads spawn from child_process's ES module at each call, whose exports follow those of its
    // CommonJS module, which this replaces, once syncBuiltinESMExports() is called.
    const original = childProcess.spawn;
    const spawned: unknown[][] = [];
    const errorHandlers: unknown[] = [];
    (childProcess as { spawn: unknown }).spawn = (...args: unknown[]) => {
      spawned.push(args);
      return { on: (event: string, handler: unknown) => { if (event === 'error') errorHandlers.push(handler); } };
    };
    syncBuiltinESMExports();
    try {
      openWithAssociatedApp(posixPath);
      openContainingFolder(posixPath);
    } finally {
      childProcess.spawn = original;
      syncBuiltinESMExports();
    }
    const expected = [commandToOpenWithAssociatedApp(posixPath), commandToOpenContainingFolder(posixPath)];
    assert.deepStrictEqual(spawned, expected.map(command => [command.file, command.args, { stdio: 'ignore', windowsVerbatimArguments: command.windowsVerbatimArguments }]));
    assert.strictEqual(errorHandlers.length, 2);
  });

  it('opens only web pages in the OS browser', () => {
    assert.strictEqual(isWebPageUrl('https://github.com/TomoyukiAota/photo-location-map'), true);
    assert.strictEqual(isWebPageUrl('http://example.com/'), true);
    for (const url of ['file:///etc/passwd', 'javascript:alert(1)', 'smb://server/share', 'mailto:a@example.com', 'not a url', '', undefined, 3])
      assert.strictEqual(isWebPageUrl(url), false, String(url));
  });
});
