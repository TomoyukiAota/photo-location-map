import assert = require('assert');
import { EventEmitter } from 'events';
import { isRecordedOtherwise, recordConsoleErrors } from '../../../src-main/record-console-errors';

describe('recordConsoleErrors (in main process)', () => {
  /** A stand-in for the page, whose console lines the test emits, and for what records an error. */
  function setUp() {
    const contents = new EventEmitter();
    const recorded: string[][] = [];
    recordConsoleErrors(contents as unknown as Electron.WebContents, (label, value) => recorded.push([label, value]));
    const log = (level: string, message: string, sourceId = '', lineNumber = 1) =>
      contents.emit('console-message', { level, message, sourceId, lineNumber });
    return { recorded, log };
  }

  it('records an error that only the console shows, with its source and line', () => {
    const { recorded, log } = setUp();

    log('error', 'Something went wrong. This line should not run.', 'file:///Applications/Photo Location Map.app/Contents/Resources/app.asar/dist/main.js', 12);

    assert.deepEqual(recorded, [['Something went wrong. This line should not run.', 'app.asar/dist/main.js:12']]);
  });

  it('keeps a web address by its origin, and takes the user\'s paths and files out', () => {
    const { recorded, log } = setUp();

    log('error', 'GET https://tile.example.org/12/3456/789.png?key=secret net::ERR_INTERNET_DISCONNECTED', 'https://tile.example.org/12/3456/789.png', 0);
    log('error', "Not allowed to load local resource: file:///Users/hanako/Pictures/Trip%20to%20Kyoto/IMG%200001.jpg", 'file:///Users/hanako/x.html', 3);

    assert.deepEqual(recorded, [
      ['GET https://tile.example.org/<path> net::ERR_INTERNET_DISCONNECTED', 'https://tile.example.org/<path>:0'],
      ['Not allowed to load local resource: <path>', '<path>:3'],
    ]);
    assert.ok(!JSON.stringify(recorded).includes('Kyoto'));
  });

  it('records only errors, and not the lines that are recorded otherwise', () => {
    const { recorded, log } = setUp();

    log('warning', 'A warning');
    log('info', 'Some info');
    log('error', '[2026-11-14 09:00:00.000] [Renderer] [error] Failed to update the Undo and Redo menus.');
    log('error', 'Uncaught (in promise) Error: x');
    log('error', 'ERROR Error: NG0100');
    log('error', 'The app could not start. Error: y');

    assert.deepEqual(recorded, []);
  });

  it('records the same message three times at most', () => {
    const { recorded, log } = setUp();

    for (let i = 0; i < 5; i++)
      log('error', 'Failed to load resource: net::ERR_NAME_NOT_RESOLVED', `https://tile.example.org/${i}.png`);

    assert.equal(recorded.length, 3);
  });

  it('tells the lines that are recorded otherwise', () => {
    assert.equal(isRecordedOtherwise('[2026-11-14 09:00:00.000] [Main] [warn] x'), true);
    assert.equal(isRecordedOtherwise('Uncaught TypeError: x'), true);
    assert.equal(isRecordedOtherwise('A library failed'), false);
  });
});
