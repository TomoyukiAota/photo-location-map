import assert = require('assert');
import {
  commandToOpenContainingFolder, commandToOpenWithAssociatedApp, isWebPageUrl, openContainingFolder, openWithAssociatedApp
} from '../../../src-main/shell/open-with-os';

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
    // The module itself, which open-with-os.ts reads spawn from at each call; an import would give a copy.
    const childProcess: { spawn: unknown } = require('child_process');
    const original = childProcess.spawn;
    const spawned: unknown[][] = [];
    const errorHandlers: unknown[] = [];
    childProcess.spawn = (...args: unknown[]) => {
      spawned.push(args);
      return { on: (event: string, handler: unknown) => { if (event === 'error') errorHandlers.push(handler); } };
    };
    try {
      openWithAssociatedApp(posixPath);
      openContainingFolder(posixPath);
    } finally {
      childProcess.spawn = original;
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
