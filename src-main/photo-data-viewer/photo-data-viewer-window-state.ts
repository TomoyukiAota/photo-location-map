import { PhotoDataViewerIpcPhotoParams } from '../../src-shared/photo-data-viewer/photo-data-viewer-ipc-params';
import { logWindowBounds, photoDataViewerLogger as logger } from '../../src-shared/photo-data-viewer/photo-data-viewer-logger';
import { UserDataStorage } from '../../src-shared/user-data-storage/user-data-storage';
import { UserDataStoragePath } from '../../src-shared/user-data-storage/user-data-stroage-path';
import { trackClosingPhotoDataViewer } from './photo-data-viewer-tracker';

const isNumber = require('is-number');

interface StateManageParams {
  browserWindow: Electron.BrowserWindow,
  photo: PhotoDataViewerIpcPhotoParams,
}

const defaultWindowState = {
  x: 100,
  y: 100,
  width: 500,
  height: 500,
};

function toNumberOrElse(numStr: string, defaultNum: number): number {
  return isNumber(numStr) ? Number(numStr) : defaultNum;
}

export class PhotoDataViewerWindowState {
  // Hold the reference to browserWindow so that events can be handled by browserWindow.on function.
  // noinspection JSMismatchedCollectionQueryUpdate
  private static readonly browserWindowRefHolder: StateManageParams[] = [];

  public static get() {
    const windowX = UserDataStorage.readOrDefault(UserDataStoragePath.PhotoDataViewer.WindowX, 'Fail to read');
    const windowY = UserDataStorage.readOrDefault(UserDataStoragePath.PhotoDataViewer.WindowY, 'Fail to read');
    const windowWidth = UserDataStorage.readOrDefault(UserDataStoragePath.PhotoDataViewer.WindowWidth, 'Fail to read');
    const windowHeight = UserDataStorage.readOrDefault(UserDataStoragePath.PhotoDataViewer.WindowHeight, 'Fail to read');

    return {
      x: toNumberOrElse(windowX, defaultWindowState.x),
      y: toNumberOrElse(windowY, defaultWindowState.y),
      width: toNumberOrElse(windowWidth, defaultWindowState.width),
      height: toNumberOrElse(windowHeight, defaultWindowState.height),
    }
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
    // browserWindow in the main process will be destructed sometime after closing the window, and
    // remote call of functions in a destructed object in the main process results in an error.
    // Therefore, in this function, the window bounds are gotten from browserWindow in the first line.
    // Getting the bounds itself is fragile in the first place, but doing so is a best-effort approach
    // to save the bounds when the window is closed.
    // This is to address the issue that the bounds after moving/resizing by Windows logo key + arrow key are not saved
    // because it does not fire browserWindow's moved/resized events.
    const bounds = this.getWindowBounds(params);
    if (!bounds) { return; }

    this.saveWindowBounds(bounds);
    logger.info(`Close Window for ${params?.photo?.path}`);
    logWindowBounds(bounds, params.photo);
    trackClosingPhotoDataViewer(bounds);
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
