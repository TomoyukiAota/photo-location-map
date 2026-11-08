import type { IpcMainEvent, IpcMainInvokeEvent, WebContents } from 'electron';

// Which page a request came from. The main window's page reaches the main process only through its preload's bridge
// (electron-util/preload/main-window.cjs), and each request handler checks the sender, so that another page, such as
// Photo Data Viewer's or one a frame or a navigation would bring, cannot ask for what the app's page may.

type IpcEvent = IpcMainEvent | IpcMainInvokeEvent;

let mainWindowContents: WebContents | undefined;
let mainWindowPageUrl: string | undefined;

/**
 * Records the main window, whose page alone may use the main window's operations: `pageUrl` is the app's page, which
 * the window loads (src-main/file-server/). Without `pageUrl`, any page of the window may, as electron-mocha's
 * renderer tests run the app's code in a page of their own (test/em-renderer-main-setup.js).
 */
export function setMainWindow(contents: WebContents | undefined, pageUrl?: string): void {
  mainWindowContents = contents;
  mainWindowPageUrl = pageUrl;
}

/**
 * The path of a file URL, decoded, so that Node.js's pathToFileURL and Chromium, which may escape a character
 * differently, give the same; on Windows without regard to case, as its file system has none.
 */
function filePathOf(url: URL): string {
  const decoded = decodeURIComponent(url.pathname);
  return process.platform === 'win32' ? decoded.toLowerCase() : decoded;
}

/** The app's page, where the page is served from a file, or from `ng serve` for live reload. */
function isAppPage(frameUrl: string): boolean {
  if (mainWindowPageUrl === undefined)
    return true;
  try {
    const page = new URL(mainWindowPageUrl);
    const frame = new URL(frameUrl);
    return page.protocol === 'file:'
      ? frame.protocol === 'file:' && filePathOf(frame) === filePathOf(page)
      : frame.origin === page.origin;
  } catch {
    return false;
  }
}

/** Whether a request came from the top frame of the main window, on the app's page. */
export function isFromMainWindow(event: IpcEvent): boolean {
  const contents = mainWindowContents;
  if (!contents || contents.isDestroyed() || event.sender !== contents)
    return false;
  const frame = event.senderFrame;
  return !!frame && !frame.parent && isAppPage(frame.url);
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
