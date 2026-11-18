import { screen } from 'electron';
import { PhotoDataViewerIpcPhotoParams } from '../../src-shared/photo-data-viewer/photo-data-viewer-ipc-params.js';
import { logWindowBounds, photoDataViewerLogger as logger } from '../../src-shared/photo-data-viewer/photo-data-viewer-logger.js';
import { UserDataStorage } from '../../src-shared/user-data-storage/user-data-storage.js';
import { UserDataStoragePath } from '../../src-shared/user-data-storage/user-data-stroage-path.js';
import { trackClosingPhotoDataViewer } from './photo-data-viewer-tracker.js';
import { logged } from '../../src-shared/log/logged-line.js';

interface StateManageParams {
  browserWindow: Electron.BrowserWindow,
  photo: PhotoDataViewerIpcPhotoParams,
}

type Rectangle = Electron.Rectangle;

/**
 * TL;DR: The window's size until the user gives it one: wide enough for the viewer's split panes, the photo and the
 * map beside the data, where the display has the room.
 * Details: In this app's window, Photo Data Viewer splits its panes when its page is wider than 1200 pixels,
 * `document.documentElement.clientWidth > 1200` (isWideLayout in src/hooks/useLayoutMode.ts of
 * TomoyukiAota/photo-data-viewer), and shows one pane at a time, with tabs, otherwise. The page is narrower than the
 * window by the window's frame, 16 pixels on Windows, and by a scroll bar of the page where one shows, up to 17 pixels
 * there: 1240 leaves room for both, and for the rounding at a display's scale factor. The old default, 500x500, showed
 * the tabs. 800 is the main window's default height (src-main/window-config.ts), and the viewer's own tests view it at
 * 1280x800.
 */
export const defaultWindowSize = { width: 1240, height: 800 } as const;

/**
 * The default bounds before defaultWindowSize. The window saves its bounds whenever it closes, whether it was moved or
 * resized or not, so every user who never resized it has this size saved, which the user did not choose.
 */
const oldDefaultBounds = { x: 100, y: 100, width: 500, height: 500 } as const;

/** What was saved of the window's bounds; a value is undefined where none was saved, or it is not a number. */
export type SavedBounds = Partial<Rectangle>;

/** `bounds` moved, and made smaller where it is larger than `area`, so that it is inside `area`. */
export function fitInto(bounds: Rectangle, area: Rectangle): Rectangle {
  const width = Math.min(bounds.width, area.width);
  const height = Math.min(bounds.height, area.height);
  return {
    x: Math.min(Math.max(bounds.x, area.x), area.x + area.width - width),
    y: Math.min(Math.max(bounds.y, area.y), area.y + area.height - height),
    width,
    height,
  };
}

/** The default size in the middle of `area`, a display's work area, made smaller where the area is. */
export function defaultBoundsIn(area: Rectangle): Rectangle {
  const width = Math.min(defaultWindowSize.width, area.width);
  const height = Math.min(defaultWindowSize.height, area.height);
  return {
    x: area.x + Math.round((area.width - width) / 2),
    y: area.y + Math.round((area.height - height) / 2),
    width,
    height,
  };
}

/**
 * The bounds that the window opens with, from those saved (`saved`):
 * - Bounds that the user gave the window stay as they are.
 * - The old default size, which only a window that was never resized has, is replaced by the default size, where the
 *   window was, moved and made smaller where needed to be in the work area of that display (`workAreaOf`).
 * - With nothing saved, or the old default bounds, of a window never moved either, the window opens in the middle of
 *   `defaultArea`, the work area of the main window's display (defaultBoundsIn).
 */
export function boundsToOpen(saved: SavedBounds, defaultArea: Rectangle,
                             workAreaOf: (bounds: Rectangle) => Rectangle): Rectangle {
  const { x, y, width, height } = saved;
  // The four are saved together: one without the others is not the window's.
  if (x === undefined || y === undefined || width === undefined || height === undefined)
    return defaultBoundsIn(defaultArea);
  if (width !== oldDefaultBounds.width || height !== oldDefaultBounds.height)
    return { x, y, width, height };
  if (x === oldDefaultBounds.x && y === oldDefaultBounds.y)
    return defaultBoundsIn(defaultArea);
  return fitInto({ x, y, ...defaultWindowSize }, workAreaOf({ x, y, width, height }));
}

/** The saved number at `storagePath`, as "-12.5" is, or undefined where none is saved or it is not a finite number. */
function readSavedNumber(storagePath: ReadonlyArray<string>): number | undefined {
  const text: unknown = UserDataStorage.readOrDefault(storagePath, '');
  const num = typeof text === 'string' && text.trim() !== '' ? Number(text) : NaN;
  return Number.isFinite(num) ? num : undefined;
}

export class PhotoDataViewerWindowState {
  // Hold the reference to browserWindow so that events can be handled by browserWindow.on function.
  // noinspection JSMismatchedCollectionQueryUpdate
  private static readonly browserWindowRefHolder: StateManageParams[] = [];

  /**
   * The bounds to open the window with (boundsToOpen): the saved ones, or by default in the middle of the work area of
   * the display of `mainWindowBounds`, the main window's, from which the user opens the viewer, or of the primary
   * display without it.
   */
  public static get(mainWindowBounds?: Rectangle): Rectangle {
    const saved: SavedBounds = {
      x: readSavedNumber(UserDataStoragePath.PhotoDataViewer.WindowX),
      y: readSavedNumber(UserDataStoragePath.PhotoDataViewer.WindowY),
      width: readSavedNumber(UserDataStoragePath.PhotoDataViewer.WindowWidth),
      height: readSavedNumber(UserDataStoragePath.PhotoDataViewer.WindowHeight),
    };
    const defaultDisplay = mainWindowBounds ? screen.getDisplayMatching(mainWindowBounds) : screen.getPrimaryDisplay();
    return boundsToOpen(saved, defaultDisplay.workArea, bounds => screen.getDisplayMatching(bounds).workArea);
  }

  public static manage(params: StateManageParams) {
    params?.browserWindow.on('resized', () => this.handleResized(params));
    params?.browserWindow.on('moved', () => this.handleMoved(params));
    params?.browserWindow.on('close', () => this.handleClose(params));
    params?.browserWindow.on('closed', () => this.handleClosed(params));
    this.browserWindowRefHolder.push(params);
  }

  private static handleResized(params: StateManageParams) {
    const bounds = this.getWindowBounds(params);
    if (!bounds) { return; }

    this.saveWindowBounds(bounds);
    logger.info(`Resized Window for ${params?.photo?.path}`);
    logWindowBounds(bounds, params.photo);
  }

  private static handleMoved(params: StateManageParams) {
    const bounds = this.getWindowBounds(params);
    if (!bounds) { return; }

    this.saveWindowBounds(bounds);
    logger.info(`Moved Window for ${params?.photo?.path}`);
    logWindowBounds(bounds, params.photo);
  }

  private static handleClose(params: StateManageParams) {
    // browserWindow will be destructed sometime after closing the window, and
    // calling functions of a destructed object results in "TypeError: Object has been destroyed" error.
    // Therefore, in this function, the window bounds are gotten from browserWindow in the first line.
    // Getting the bounds itself is fragile in the first place, but doing so is a best-effort approach
    // to save the bounds when the window is closed.
    // This is to address the issue that the bounds after moving/resizing by Windows logo key + arrow key are not saved
    // because it does not fire browserWindow's moved/resized events.

    try {
      const bounds = this.getWindowBounds(params);
      if (!bounds) { return; }

      this.saveWindowBounds(bounds);
      logger.info(`Close Window for ${params?.photo?.path}`);
      logWindowBounds(bounds, params.photo);
      trackClosingPhotoDataViewer(bounds);
    } catch (error) {
      // Catching the error so that the Unhandled Promise Rejection dialog for "TypeError: Object has been destroyed" does not pop up.
      logger.warn(logged`Error occurred when closing the window for ${params?.photo?.path}`, error);
      logger.warnNotRecorded(`error?.toString?.(): ${error?.toString?.()}`);
      console.warn(error); // Print information such as stack trace in the console
    }
  }

  private static handleClosed(params: StateManageParams) {
    if (params) {
      params = null; // Ensure that the reference for browserWindow is removed.
    }
  }

  private static getWindowBounds(params: StateManageParams) {
    return params?.browserWindow?.getBounds?.();
  }

  private static saveWindowBounds(bounds: Electron.Rectangle) {
    if (!bounds) { return; }

    const {x, y, width, height} = bounds;
    UserDataStorage.write(UserDataStoragePath.PhotoDataViewer.WindowX, x.toString());
    UserDataStorage.write(UserDataStoragePath.PhotoDataViewer.WindowY, y.toString());
    UserDataStorage.write(UserDataStoragePath.PhotoDataViewer.WindowWidth, width.toString());
    UserDataStorage.write(UserDataStoragePath.PhotoDataViewer.WindowHeight, height.toString());
  }
}
