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

/** A window of `size` in the middle of `area`, a display's work area, made smaller where the area is. */
export function centeredIn(area: Rectangle, size: Pick<Rectangle, 'width' | 'height'>): Rectangle {
  const width = Math.min(size.width, area.width);
  const height = Math.min(size.height, area.height);
  return {
    x: area.x + Math.round((area.width - width) / 2),
    y: area.y + Math.round((area.height - height) / 2),
    width,
    height,
  };
}

/** The default size in the middle of `area`, a display's work area, made smaller where the area is. */
export function defaultBoundsIn(area: Rectangle): Rectangle {
  return centeredIn(area, defaultWindowSize);
}

/**
 * The height of the window's title bar, by which the user drags the window: about 31 pixels on Windows, 28 to 32 on
 * macOS.
 */
const titleBarHeight = 32;

/**
 * TL;DR: How much of its title bar the window needs in the work area of a display for the user to see it and drag it.
 * Details: Saved bounds can be where no display is now, as after the display that the window was on was disconnected
 * or the displays were arranged anew, and the window would open where the user cannot see it. 100 pixels of the title
 * bar's width leave a part to take hold of. Half of its height leaves room for a window saved while maximized on
 * Windows, whose bounds go past the work area by its frame, about 8 pixels, at the top too. Not the whole window, as
 * electron-window-state asks of the main window: the user can leave a window partly past an edge of the screen, or
 * across two displays, and it opens there again.
 */
const visibleTitleBar = { width: 100, height: titleBarHeight / 2 } as const;

/**
 * The work area, of `workAreas`, that has the most of the title bar of a window of `bounds`, where one has enough of
 * it for the user to see it and drag it (visibleTitleBar), or undefined.
 */
function workAreaWithTitleBar(bounds: Rectangle, workAreas: ReadonlyArray<Rectangle>): Rectangle | undefined {
  const titleBar = { ...bounds, height: Math.min(bounds.height, titleBarHeight) };
  const parts = workAreas.map(area => ({
    area,
    width: Math.min(titleBar.x + titleBar.width, area.x + area.width) - Math.max(titleBar.x, area.x),
    height: Math.min(titleBar.y + titleBar.height, area.y + area.height) - Math.max(titleBar.y, area.y),
  })).filter(part => part.width >= Math.min(visibleTitleBar.width, titleBar.width)
    && part.height >= Math.min(visibleTitleBar.height, titleBar.height));
  return parts.sort((a, b) => b.width * b.height - a.width * a.height)[0]?.area;
}

/** The work areas of the displays, in the same pixels as the window's bounds. */
export interface WorkAreas {
  /** The main window's display's, where the window opens by default. */
  readonly main: Rectangle;
  /** Every display's. */
  readonly all: ReadonlyArray<Rectangle>;
}

/**
 * The bounds that the window opens with, from those saved (`saved`):
 * - Bounds that the user gave the window stay as they are, where enough of the window's title bar is in the work area
 *   of a display for the user to see it and drag it (visibleTitleBar).
 * - The old default size, which only a window that was never resized has, is replaced by the default size, where the
 *   window was, moved and made smaller where needed to be in the work area of that display.
 * - A window that would be out of sight there keeps its size, made smaller where needed, in the middle of the work
 *   area of the main window's display, or gets the default size there instead of the old one.
 * - With nothing saved, or the old default bounds, of a window never moved either, the window opens in the middle of
 *   the main window's display (defaultBoundsIn).
 */
export function boundsToOpen(saved: SavedBounds, workAreas: WorkAreas): Rectangle {
  const { x, y, width, height } = saved;
  // The four are saved together: one without the others is not the window's.
  if (x === undefined || y === undefined || width === undefined || height === undefined)
    return defaultBoundsIn(workAreas.main);
  const hasOldDefaultSize = width === oldDefaultBounds.width && height === oldDefaultBounds.height;
  if (hasOldDefaultSize && x === oldDefaultBounds.x && y === oldDefaultBounds.y)
    return defaultBoundsIn(workAreas.main);
  const area = workAreaWithTitleBar({ x, y, width, height }, workAreas.all);
  if (!area)
    return centeredIn(workAreas.main, hasOldDefaultSize ? defaultWindowSize : { width, height });
  if (!hasOldDefaultSize)
    return { x, y, width, height };
  return fitInto({ x, y, ...defaultWindowSize }, area);
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
   * The bounds to open the window with (boundsToOpen): the saved ones, where the user can see the window there, or
   * else in the middle of the work area of the display of `mainWindowBounds`, the main window's, from which the user
   * opens the viewer, or of the primary display without it.
   */
  public static get(mainWindowBounds?: Rectangle): Rectangle {
    const saved: SavedBounds = {
      x: readSavedNumber(UserDataStoragePath.PhotoDataViewer.WindowX),
      y: readSavedNumber(UserDataStoragePath.PhotoDataViewer.WindowY),
      width: readSavedNumber(UserDataStoragePath.PhotoDataViewer.WindowWidth),
      height: readSavedNumber(UserDataStoragePath.PhotoDataViewer.WindowHeight),
    };
    const mainDisplay = mainWindowBounds ? screen.getDisplayMatching(mainWindowBounds) : screen.getPrimaryDisplay();
    const all = screen.getAllDisplays().map(display => display.workArea);
    return boundsToOpen(saved, { main: mainDisplay.workArea, all });
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
