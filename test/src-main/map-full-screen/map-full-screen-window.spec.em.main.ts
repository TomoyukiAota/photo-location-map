import assert from 'assert';
import { EventEmitter } from 'events';
import { IpcConstants } from '../../../src-shared/ipc/ipc-constants.js';
import {
  configureMainWindowForMapFullScreen, FullScreenWindow, MapFullScreenState
} from '../../../src-main/map-full-screen/map-full-screen-window.js';

/** A window that records the calls to its full screen, which it enters and leaves at once unless `inTransition`. */
class WindowDouble implements FullScreenWindow {
  public readonly calls: boolean[] = [];
  /** As a macOS window going to full screen, which isFullScreen() does not tell yet. */
  public inTransition = false;
  constructor(public fullScreen = false) {}
  public isFullScreen(): boolean { return this.fullScreen && !this.inTransition; }
  public setFullScreen(flag: boolean): void {
    this.calls.push(flag);
    this.fullScreen = flag;
  }
}

describe('The map\'s full screen in the main window', () => {
  for (const platform of ['darwin', 'win32', 'linux'] as const) {
    it(`puts the window in full screen with the map, and gives it back without it, on ${platform}`, () => {
      const state = new MapFullScreenState(platform);
      const window = new WindowDouble();

      state.set(true, window);
      assert.deepStrictEqual([state.on, window.calls, window.fullScreen], [true, [true], true]);
      state.set(true, window);
      assert.deepStrictEqual(window.calls, [true]);
      state.set(false, window);
      assert.deepStrictEqual([state.on, window.calls, window.fullScreen], [false, [true, false], false]);
    });

    it(`keeps a window that was in full screen before the map in full screen after it, on ${platform}`, () => {
      const state = new MapFullScreenState(platform);
      const window = new WindowDouble(true);

      state.set(true, window);
      state.set(false, window);
      assert.deepStrictEqual([state.on, window.calls, window.fullScreen], [false, [], true]);
    });
  }

  it('leaves nothing to do for a window that has already left full screen by itself, but on macOS, where Electron sees to it', () => {
    for (const [platform, expected] of [['win32', [true]], ['linux', [true]], ['darwin', [true, false]]] as const) {
      const state = new MapFullScreenState(platform);
      const window = new WindowDouble();
      state.set(true, window);
      window.fullScreen = false;
      state.set(false, window);
      assert.deepStrictEqual(window.calls, expected, platform);
    }
  });

  it('takes a macOS window out of full screen when the map leaves it during the window\'s transition to it', () => {
    const state = new MapFullScreenState('darwin');
    const window = new WindowDouble();
    state.set(true, window);
    window.inTransition = true;
    state.set(false, window);
    assert.deepStrictEqual(window.calls, [true, false]);
  });

  it('tells the page when the window leaves full screen while the map is in full screen, and only then', () => {
    const state = new MapFullScreenState('darwin');
    const sent: string[] = [];
    const window = Object.assign(new EventEmitter(), { webContents: { send: (channel: string) => { sent.push(channel); } } });
    state.on = true;

    configureMainWindowForMapFullScreen(window, state);
    // A new window's page starts with the map out of full screen.
    assert.strictEqual(state.on, false);
    window.emit('leave-full-screen');
    assert.deepStrictEqual(sent, []);

    state.set(true, new WindowDouble(true));
    window.emit('leave-full-screen');
    assert.deepStrictEqual(sent, [IpcConstants.MapFullScreen.WindowLeft]);
  });
});
