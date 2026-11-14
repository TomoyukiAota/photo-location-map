import assert from 'assert';
import * as path from 'path';
import { pathToFileURL } from 'url';
import english from '../../../src-shared/i18n/locales/en.json' with { type: 'json' };
import {
  handleUnhandledError,
  translateUnhandledErrorDialog,
  UnhandledErrorHandlers,
} from '../../../src-main/unhandled-errors.js';

describe('handleUnhandledError (in main process)', () => {
  // A home folder as this operating system writes one, so that its paths and file URLs are those of a real stack.
  const home = process.platform === 'win32' ? 'C:\\Users\\someone' : '/home/someone';

  /** Stand-ins for the log, analytics and Electron's dialogs, which record what they are given. */
  function setUp({ isReady = true, response = 0, homeFolder = home } = {}) {
    const calls = {
      logged: [] as [string, Error][],
      recorded: [] as Error[],
      messageBoxes: [] as Electron.MessageBoxSyncOptions[],
      errorBoxes: [] as [string, string][],
      copied: [] as string[],
    };
    const use: UnhandledErrorHandlers = {
      log: (kind, error) => calls.logged.push([kind, error]),
      record: error => calls.recorded.push(error),
      isReady: () => isReady,
      showMessageBox: options => {
        calls.messageBoxes.push(options);
        return response;
      },
      showErrorBox: (title, content) => calls.errorBoxes.push([title, content]),
      copy: text => calls.copied.push(text),
      homeFolder: () => homeFolder,
    };
    return { calls, use };
  }

  /** An error with the stack given, so that the test knows what the dialog shows. */
  function errorWithStack(stack: string): Error {
    const error = new Error(stack.split('\n')[0].replace(/^Error: /, ''));
    error.stack = stack;
    return error;
  }

  it('logs and records the error, and shows its kind and stack under a message in English', () => {
    const { calls, use } = setUp();
    const error = errorWithStack('Error: The disk is full.\n    at write (/app/out/app/src-main/a.js:1:2)');

    handleUnhandledError('Unhandled Error', error, use);

    assert.deepEqual(calls.logged, [['Unhandled Error', error]]);
    assert.deepEqual(calls.recorded, [error]);
    assert.deepEqual(calls.messageBoxes, [{
      type: 'error',
      message: 'An unexpected error occurred.',
      detail: 'Unhandled Error\nError: The disk is full.\n    at write (/app/out/app/src-main/a.js:1:2)',
      buttons: ['OK', 'Copy Error'],
      defaultId: 0,
      noLink: true,
    }]);
    assert.deepEqual(calls.copied, []);
  });

  it('copies the message and the details when the second button is clicked', () => {
    const { calls, use } = setUp({ response: 1 });

    handleUnhandledError('Unhandled Promise Rejection', errorWithStack('Error: Rejected.\n    at f (/app/a.js:1:2)'), use);

    assert.deepEqual(calls.copied, ['An unexpected error occurred.\nUnhandled Promise Rejection\nError: Rejected.\n    at f (/app/a.js:1:2)']);
  });

  it('shows the error box before the app is ready, as no other dialog can be shown then', () => {
    const { calls, use } = setUp({ isReady: false });

    handleUnhandledError('Unhandled Error', errorWithStack('Error: Too early.'), use);

    assert.deepEqual(calls.messageBoxes, []);
    assert.deepEqual(calls.errorBoxes, [['An unexpected error occurred.', 'Unhandled Error\nError: Too early.']]);
  });

  it('describes a value that is not an error, which a promise can be rejected with', () => {
    const { calls, use } = setUp();

    handleUnhandledError('Unhandled Promise Rejection', { reason: 'not an error' }, use);

    const [[, logged]] = calls.logged;
    assert.equal(logged.name, 'NonError');
    assert.equal(logged.message, '{ reason: \'not an error\' }');
    assert.match(calls.messageBoxes[0].detail ?? '', /^Unhandled Promise Rejection\nNonError: \{ reason: 'not an error' \}\n/);
  });

  it('writes the home folder as ~, in a path and in the file URL of a module, but not in another folder', () => {
    const { calls, use } = setUp();
    const picture = path.join(home, 'Pictures', 'a.jpg');
    const moduleUrl = pathToFileURL(path.join(home, 'app', 'b.js')).href;
    const otherFolder = path.join(`${home}-else`, 'c.js');

    handleUnhandledError('Unhandled Error', errorWithStack([
      `Error: ENOENT: no such file or directory, open '${picture}'`,
      `    at load (${moduleUrl}:3:4)`,
      `    at read (${otherFolder}:5:6)`,
    ].join('\n')), use);

    assert.equal(calls.messageBoxes[0].detail, [
      'Unhandled Error',
      `Error: ENOENT: no such file or directory, open '${path.join('~', 'Pictures', 'a.jpg')}'`,
      '    at load (~/app/b.js:3:4)',
      `    at read (${otherFolder}:5:6)`,
    ].join('\n'));
  });

  it('shows the dialog in the application\'s language once the language is decided', () => {
    const { calls, use } = setUp();
    translateUnhandledErrorDialog(key => `[${key}]`);
    try {
      handleUnhandledError('Unhandled Error', errorWithStack('Error: Translated.'), use);
    } finally {
      translateUnhandledErrorDialog(key => key.split('.').reduce<any>((texts, name) => texts[name], english));
    }

    assert.equal(calls.messageBoxes[0].message, '[unhandledError.message]');
    assert.deepEqual(calls.messageBoxes[0].buttons, ['[common.ok]', '[unhandledError.copyError]']);
  });

  it('still records the error and shows the dialog when logging fails, and throws nothing when the dialog fails', () => {
    const { calls, use } = setUp();
    const consoleError = console.error;
    const written: unknown[][] = [];
    console.error = (...args: unknown[]) => written.push(args);
    try {
      handleUnhandledError('Unhandled Error', errorWithStack('Error: First.'), { ...use, log: () => { throw new Error('The log failed.'); } });
      assert.equal(calls.recorded.length, 1);
      assert.equal(calls.messageBoxes.length, 1);

      const showMessageBox = () => { throw new Error('The dialog failed.'); };
      assert.doesNotThrow(() => handleUnhandledError('Unhandled Error', errorWithStack('Error: Second.'), { ...use, showMessageBox }));
    } finally {
      console.error = consoleError;
    }

    assert.deepEqual(written.map(([text]) => text), ['Logging an unhandled error failed:', 'Showing an unhandled error failed:']);
  });
});
