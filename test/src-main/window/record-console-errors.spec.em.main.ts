import assert from 'assert';
import { EventEmitter } from 'events';
import { isContentSecurityPolicyLine, isRecordedOtherwise, recordConsoleErrors } from '../../../src-main/record-console-errors.js';

describe('recordConsoleErrors (in main process)', () => {
  /** A stand-in for the page, whose console lines the test emits, and for what records an error. */
  function setUp() {
    const contents = new EventEmitter();
    const recorded: string[][] = [];
    const logged: string[] = [];
    recordConsoleErrors(contents as unknown as Electron.WebContents, (label, value) => recorded.push([label, value]),
      line => logged.push(line));
    const log = (level: string, message: string, sourceId = '', lineNumber = 1) =>
      contents.emit('console-message', { level, message, sourceId, lineNumber });
    return { recorded, logged, log };
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

  it('writes a violation of the page\'s Content Security Policy to the log, whole, and records it as an error', () => {
    const { recorded, logged, log } = setUp();
    const violation = "Loading the image 'http://tiles.example.org/12/3456/789.png' violates the following Content Security Policy directive: \"img-src 'self' data: blob: plm-file: https:\". The action has been blocked.";

    log('error', violation, 'plm-app://app/chunk-ABC.js', 7);
    log('error', 'Failed to load resource: net::ERR_CONNECTION_REFUSED', 'https://tile.example.org/1.png');
    // A line of the page's logger is in the log already.
    log('error', '[2026-11-19 09:00:00.000] [Renderer] [error] The Content Security Policy refused something.');

    assert.deepEqual(logged, [`[Content Security Policy] The main window's page: ${violation} (plm-app://app/chunk-ABC.js:7)`]);
    assert.equal(recorded.length, 2);
    assert.match(recorded[0][0], /^Loading the image 'http:\/\/tiles\.example\.org\/<path>' violates the following Content Security Policy directive/);
  });

  it('tells the lines about the Content Security Policy', () => {
    assert.equal(isContentSecurityPolicyLine("Executing inline script violates the following Content Security Policy directive 'script-src 'self''."), true);
    assert.equal(isContentSecurityPolicyLine("Refused to connect to 'https://example.org/' because it violates the following Content Security Policy directive: \"connect-src 'none'\"."), true);
    assert.equal(isContentSecurityPolicyLine("Unrecognized Content-Security-Policy directive 'script-scr'."), true);
    assert.equal(isContentSecurityPolicyLine('Failed to load resource: net::ERR_NAME_NOT_RESOLVED'), false);
  });

  it('tells the lines that are recorded otherwise', () => {
    assert.equal(isRecordedOtherwise('[2026-11-14 09:00:00.000] [Main] [warn] x'), true);
    assert.equal(isRecordedOtherwise('Uncaught TypeError: x'), true);
    assert.equal(isRecordedOtherwise('A library failed'), false);
  });
});
