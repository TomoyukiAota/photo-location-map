import { IpcConstants } from '../../src-shared/ipc/ipc-constants.js';

// TL;DR: The map in full screen is the window in full screen, with the map alone in it. The page keeps whether the
// map is in full screen, and hides the sidebar and the chart (src/app/map/leaflet-map/full-screen/); the main process
// puts the window in full screen with it, and checks the View menu's item (src-main/menu/map-full-screen.ts).
// Details:
// - The window's full screen is Electron's, as View > Toggle Full Screen has it: on macOS, the window moves to a
//   space of its own; on Windows, the menu bar stays (electron-main.ts); on Linux, Electron hides it.
// - A window that was in full screen before the map stays in full screen after it. The window leaving full screen by
//   its own means, as View > Toggle Full Screen, its shortcut or the window's green button on macOS, ends the map's
//   full screen too.
// - Not the browser's Fullscreen API on the map's element, for which Electron 45 also takes the window to full
//   screen: the menus and the dialogs, which Angular's CDK shows outside the map, would be seen but would take no
//   click, and Esc would not reach the page (docs/tasks/20261125_map-full-screen/STATUS.md).

/** The window, as the map's full screen uses it: a BrowserWindow. */
export interface FullScreenWindow {
  isFullScreen(): boolean;
  setFullScreen(flag: boolean): void;
}

/** Whether the map is in full screen, and whether the window was in full screen before it, for one window. */
export class MapFullScreenState {
  /** Whether the map is in full screen, as the page last said. */
  public on = false;
  /** Whether the window was in full screen when the map went to full screen, which it then stays in. */
  private windowWasFullScreen = false;

  constructor(private readonly platform: NodeJS.Platform = process.platform) {}

  /** The page has put the map in full screen, or taken it out: the window follows, unless it was in full screen before. */
  public set(on: boolean, window: FullScreenWindow): void {
    if (on === this.on)
      return;
    this.on = on;
    if (on) {
      this.windowWasFullScreen = window.isFullScreen();
      if (!this.windowWasFullScreen)
        window.setFullScreen(true);
      return;
    }
    // On macOS, the window goes to full screen in a transition, during which isFullScreen() may not say so yet:
    // Electron then leaves full screen once the transition has ended, and does nothing for a window that is not in full
    // screen. Elsewhere, the window is in full screen at once.
    if (!this.windowWasFullScreen && (this.platform === 'darwin' || window.isFullScreen()))
      window.setFullScreen(false);
  }
}

/** The map's full screen in the main window. */
export const mapFullScreenState = new MapFullScreenState();

/** What the map's full screen needs of the main window: its event of leaving full screen, and its page. */
export interface MainWindowForMapFullScreen {
  on(event: 'leave-full-screen', listener: () => void): unknown;
  readonly webContents: { send(channel: string): void };
}

/**
 * Tells the page when the window leaves full screen while the map is in full screen, which ends the map's full screen.
 * A new main window's page starts with the map out of full screen.
 */
export function configureMainWindowForMapFullScreen(window: MainWindowForMapFullScreen, state = mapFullScreenState): void {
  state.on = false;
  window.on('leave-full-screen', () => {
    if (state.on)
      window.webContents.send(IpcConstants.MapFullScreen.WindowLeft);
  });
}
