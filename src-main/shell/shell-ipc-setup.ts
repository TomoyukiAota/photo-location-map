import { ipcMain, shell } from 'electron';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants.js';
import { setUrlOpener } from '../../src-shared/url/open-url.js';
import { assertFromMainWindow } from '../ipc/ipc-sender.js';
import { isInUserChosenFolder } from '../ipc/user-chosen-folders.js';
import { isWebPageUrl, openContainingFolder, openWithAssociatedApp } from './open-with-os.js';

// What the main window's page opens with the OS: web pages, and the files and folders of the folders the user opened.

setUrlOpener(url => shell.openExternal(url));

ipcMain.handle(IpcConstants.Shell.OpenExternal, (event, url: unknown) => {
  assertFromMainWindow(event, 'Opening a URL');
  if (!isWebPageUrl(url))
    throw new Error('Only an http or https URL can be opened in the OS browser.');
  // shell.openExternal is looked up at each call, so that the e2e suite can record the URLs instead.
  return shell.openExternal(url);
});

/** Throws unless `filePath` is in a folder that the user opened, the only files that the page may open with the OS. */
function assertInUserChosenFolder(filePath: unknown): asserts filePath is string {
  if (!isInUserChosenFolder(filePath))
    throw new Error('Only a file or folder in a folder that the user opened can be opened with the OS.');
}

ipcMain.handle(IpcConstants.Shell.OpenWithAssociatedApp, (event, filePath: unknown) => {
  assertFromMainWindow(event, 'Opening a file');
  assertInUserChosenFolder(filePath);
  openWithAssociatedApp(filePath);
});

ipcMain.handle(IpcConstants.Shell.OpenContainingFolder, (event, filePath: unknown) => {
  assertFromMainWindow(event, 'Opening a folder');
  assertInUserChosenFolder(filePath);
  openContainingFolder(filePath);
});
