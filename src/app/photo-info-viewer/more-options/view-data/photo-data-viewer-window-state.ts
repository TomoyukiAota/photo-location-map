import isNumber from 'is-number';
import { UserDataStorage } from '../../../../../src-shared/user-data-storage/user-data-storage';
import { UserDataStoragePath } from '../../../../../src-shared/user-data-storage/user-data-stroage-path';

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
  private static readonly browserWindowRefHolder: Electron.BrowserWindow[] = [];

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

  public static manage(browserWindow: Electron.BrowserWindow) {
    browserWindow.on('resized', () => this.saveState(browserWindow));
    browserWindow.on('moved', () => this.saveState(browserWindow));
    browserWindow.on('close', () => this.saveState(browserWindow));
    browserWindow.on('closed', () => this.handleClosed(browserWindow));
    this.browserWindowRefHolder.push(browserWindow);
  }

  private static saveState(browserWindow: Electron.BrowserWindow) {
    if (!browserWindow) { return; }

    const bounds = browserWindow.getBounds();
    UserDataStorage.write(UserDataStoragePath.PhotoDataViewer.WindowX, bounds.x.toString());
    UserDataStorage.write(UserDataStoragePath.PhotoDataViewer.WindowY, bounds.y.toString());
    UserDataStorage.write(UserDataStoragePath.PhotoDataViewer.WindowWidth, bounds.width.toString());
    UserDataStorage.write(UserDataStoragePath.PhotoDataViewer.WindowHeight, bounds.height.toString());
  }

  private static handleClosed(browserWindow: Electron.BrowserWindow) {
    browserWindow = null;
  }
}
