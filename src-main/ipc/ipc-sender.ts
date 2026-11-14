import type { IpcMainEvent, IpcMainInvokeEvent, WebContents } from 'electron';

// Which page a request came from. The main window's page reaches the main process only through its preload's bridge
// (electron-util/preload/main-window.cjs), and each request handler checks the sender, so that another window's page,
// such as Photo Data Viewer's, and a frame within a page cannot ask for what the app's page may.
// TL;DR: The main window's top frame, whatever its URL: the window cannot leave the app's page (main-window-pages.ts).
// Details: Checking the frame's URL as well raced the preload. The preload asks for the startup metadata
// synchronously at the start of the document, and the main process can handle that request before it learns of the
// navigation's commit, which comes on another pipe: the frame's URL was then still the previous one, and the app's
// page was refused, in about 1 of 100 launches of the e2e suite. The other way, a page of another site could have
// been answered for the app's page; the window now never navigates to one.

type IpcEvent = IpcMainEvent | IpcMainInvokeEvent;

let mainWindowContents: WebContents | undefined;

/**
 * Records the main window, whose page alone may use the main window's operations. electron-mocha's renderer tests
 * record theirs, which runs the app's renderer code (test/em-renderer-main-setup.ts).
 */
export function setMainWindow(contents: WebContents | undefined): void {
  mainWindowContents = contents;
}

/** Whether a request came from the top frame of the main window. */
export function isFromMainWindow(event: IpcEvent): boolean {
  const contents = mainWindowContents;
  if (!contents || contents.isDestroyed() || event.sender !== contents)
    return false;
  const frame = event.senderFrame;
  return !!frame && !frame.parent;
}

/** Throws, which rejects the request, unless it came from the main window's page. */
export function assertFromMainWindow(event: IpcEvent, operation: string): void {
  if (!isFromMainWindow(event))
    throw new Error(`${operation} is only for the main window.`);
}

const photoDataViewerContents = new Set<WebContents>();

/** Records a window of Photo Data Viewer (src-main/photo-data-viewer/), which may send analytics events. */
export function addPhotoDataViewerWindow(contents: WebContents): void {
  photoDataViewerContents.add(contents);
  contents.once('destroyed', () => photoDataViewerContents.delete(contents));
}

/** Whether a request came from the top frame of a window of Photo Data Viewer. */
export function isFromPhotoDataViewerWindow(event: IpcEvent): boolean {
  return photoDataViewerContents.has(event.sender) && !event.sender.isDestroyed()
    && !!event.senderFrame && !event.senderFrame.parent;
}
