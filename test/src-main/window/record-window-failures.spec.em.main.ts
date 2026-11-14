import assert from 'assert';
import { EventEmitter } from 'events';
import { maxUnresponsiveEventsPerWindow, recordWindowFailures, WindowFailureRecorders } from '../../../src-main/record-window-failures.js';

describe('recordWindowFailures (in main process)', () => {
  /** A stand-in for a window, whose events the test emits, and for what records a failure. */
  function setUp() {
    const window = Object.assign(new EventEmitter(), { webContents: new EventEmitter() });
    const events: string[][] = [];
    const errors: unknown[] = [];
    let time = 1000;
    const record: WindowFailureRecorders = {
      trackEvent: (category, action, label) => events.push(label === undefined ? [category, action] : [category, action, label]),
      recordError: error => errors.push(error),
      now: () => time,
    };
    recordWindowFailures(window as unknown as Electron.BrowserWindow, 'Main Window', record);
    return { window, events, errors, passSeconds: (seconds: number) => { time += seconds * 1000; } };
  }

  it('records the error of a preload script that failed, which leaves the page without its bridge', () => {
    const { window, events, errors } = setUp();
    const error = new Error('The preload threw.');

    window.webContents.emit('preload-error', {}, '/app/electron-util/preload/main-window.cjs', error);

    assert.deepEqual(errors, [error]);
    assert.deepEqual(events, []);
  });

  it('records that the window stopped answering, and after how long it answered again', () => {
    const { window, events, passSeconds } = setUp();

    window.emit('unresponsive');
    passSeconds(12.4);
    window.emit('responsive');

    assert.deepEqual(events, [
      ['Window Unresponsive', 'Window Unresponsive: Main Window'],
      ['Window Unresponsive', 'Window Responsive Again: Main Window', 'After: 12 s'],
    ]);
  });

  it('records nothing for an event that does not follow its other half', () => {
    const { window, events } = setUp();

    window.emit('responsive'); // Without having stopped answering.
    window.emit('unresponsive');
    window.emit('unresponsive'); // Still not answering.

    assert.deepEqual(events, [['Window Unresponsive', 'Window Unresponsive: Main Window']]);
  });

  it('stops recording a window that stops answering again and again', () => {
    const { window, events } = setUp();

    for (let time = 0; time < maxUnresponsiveEventsPerWindow + 2; time++) {
      window.emit('unresponsive');
      window.emit('responsive');
    }

    assert.equal(events.length, maxUnresponsiveEventsPerWindow * 2);
  });
});
