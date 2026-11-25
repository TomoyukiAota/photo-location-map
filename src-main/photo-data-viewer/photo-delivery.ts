import { randomBytes } from 'crypto';
import { net, WebContents } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';
import { Analytics } from '../../src-shared/analytics/analytics.js';
import type { PhotoDataViewerPhoto } from '../../src-shared/photo-data-viewer/photo-data-viewer-bridge.js';
import { PhotoDataViewerIpcPhotoParams } from '../../src-shared/photo-data-viewer/photo-data-viewer-ipc-params.js';
import { photoDataViewerLogger as logger } from '../../src-shared/photo-data-viewer/photo-data-viewer-logger.js';
import { getPhotoDataViewerServerUrl } from './photo-data-viewer-server-config.js';
import { logged } from '../../src-shared/log/logged-line.js';
import { pathOfAddress } from '../../src-shared/url/address-path.js';

// TL;DR: How Photo Data Viewer's page, without Node.js, gets the photo of its window: a capability, a random token
// for that photo, which only that window's page has and may use, from the viewer's origin, until the window leaves
// the viewer's origin, closes or its page crashes. The page never learns the photo's path.
// Details: A page asks through its preload (electron-util/preload/photo-data-viewer.cjs). With the 'url' transport, it
// gets a URL of the plm-photo scheme, which protocol.handle answers with the file's stream from net.fetch, so that the
// main process does not hold the whole photo; with 'ipc', it gets the bytes. protocol.handle has a Request, not the
// window, so the token stands for the window, and the request must come from the viewer's page (respondToPhotoRequest).
// A test profile chooses the transport (PLM_TEST_PHOTO_TRANSPORT), to compare them
// (docs/tasks/20261106_remove-electron-remote/).

export const photoScheme = 'plm-photo';
/** The origin of a photo's URL (photoUrl), before its token. */
const photoOrigin = `${photoScheme}://photo`;

type Transport = 'url' | 'ipc';

/** How the page gets its photo: by its URL, or by its bytes over IPC where a test profile chooses so. */
function transport(): Transport {
  const chosen = process.env.PLM_TEST_ROOT ? process.env.PLM_TEST_PHOTO_TRANSPORT : undefined;
  return chosen === 'ipc' ? 'ipc' : 'url';
}

interface Capability {
  readonly token: string;
  readonly filePath: string;
  readonly name: string;
  readonly type: string;
}

const capabilitiesByContents = new Map<WebContents, Capability>();
const capabilitiesByToken = new Map<string, Capability>();
const askedForPhoto = new WeakSet<WebContents>();

/** The MIME types of the photos' extensions, as `mime-types` 2.1.35 gave them to the viewer, which read the file itself. */
const mimeTypes: Record<string, string> = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.jpe': 'image/jpeg', '.png': 'image/png', '.tif': 'image/tiff',
  '.tiff': 'image/tiff', '.heic': 'image/heic', '.heif': 'image/heif', '.webp': 'image/webp',
};

/** The MIME type of the photo named `fileName`, by its extension, or '' for another extension. */
export function photoMimeType(fileName: string): string {
  return mimeTypes[path.extname(fileName).toLowerCase()] ?? '';
}

/** The viewer's origin, its server's address up to the path: "https://pdv-in-plm.vercel.app". */
function viewerOrigin(): string {
  const serverUrl = getPhotoDataViewerServerUrl();
  return /^[^/]*\/\/[^/]*/.exec(serverUrl)?.[0] ?? serverUrl;
}

/**
 * Whether `url` is a page of the viewer's origin, as Chromium writes a page's address: the origin, then the path. The
 * address is read as a text, not with Node.js's URL, whose parts were now and then another URL's in the e2e suite
 * (src-main/file-server/app-page.ts).
 */
export function isViewerPage(url: string | undefined): boolean {
  return !!url && url.startsWith(`${viewerOrigin()}/`);
}

/** Ends the capability of the window of `contents`, if it has one, so that its token gives the photo no more. */
function revoke(contents: WebContents): void {
  const capability = capabilitiesByContents.get(contents);
  if (!capability)
    return;
  capabilitiesByContents.delete(contents);
  capabilitiesByToken.delete(capability.token);
}

/** The URL of the photo of `capability`, which only the viewer's page of its window has. */
export function photoUrl(capability: Pick<Capability, 'token'>): string {
  return `${photoOrigin}/${capability.token}`;
}

/**
 * Keeps the window of `contents` on the viewer's origin: its links open in the OS browser (launch-photo-data-viewer.ts),
 * and a navigation elsewhere, as a dropped file would start, is prevented, so that no other page gets the photo.
 */
export function keepOnViewerPages(contents: WebContents): void {
  /** Prevents a navigation or a redirect that would leave the viewer's origin, and logs it. */
  const prevent = (event: Electron.Event<{ url: string }>) => {
    if (!isViewerPage(event.url)) {
      event.preventDefault();
      logger.warn(`Prevented a navigation of Photo Data Viewer's window away from the viewer.`);
    }
  };
  contents.on('will-navigate', prevent);
  contents.on('will-redirect', prevent);
}

/**
 * Gives the window of `contents` its photo, before the window loads the viewer. A reload keeps it; a page of another
 * origin, the window's close and a crash of its page revoke it.
 */
export function grantPhoto(contents: WebContents, photo: PhotoDataViewerIpcPhotoParams): void {
  revoke(contents);
  const capability: Capability = {
    token: randomBytes(32).toString('hex'), filePath: photo.path, name: photo.name, type: photoMimeType(photo.name),
  };
  capabilitiesByContents.set(contents, capability);
  capabilitiesByToken.set(capability.token, capability);
  contents.on('did-start-navigation', details => {
    if (details.isMainFrame && !details.isSameDocument && !isViewerPage(details.url))
      revoke(contents);
  });
  contents.once('render-process-gone', () => revoke(contents));
  contents.once('destroyed', () => revoke(contents));
  watchThatThePageAsks(contents);
}

/**
 * Says so when the viewer's page did not ask for its photo once loaded: a viewer that does not know this bridge, as
 * before stage C2, shows nothing in an isolated window. Its page is never given Node.js instead.
 */
function watchThatThePageAsks(contents: WebContents): void {
  contents.once('did-finish-load', () => {
    const timer = setTimeout(() => {
      if (contents.isDestroyed() || askedForPhoto.has(contents))
        return;
      logger.warn(`The page of Photo Data Viewer did not ask for its photo within 15 seconds of loading. Is it a viewer that does not know the bridge of an isolated window?`);
      Analytics.trackEvent('Photo Data Viewer', '[PDV] Photo Not Asked For', 'Not asked for within 15 s of loading');
    }, 15000);
    timer.unref();
  });
}

/** The photo of the window that `sender` is, for its viewer's page. */
export async function photoFor(sender: WebContents, chosenTransport: Transport = transport()): Promise<PhotoDataViewerPhoto> {
  const capability = capabilitiesByContents.get(sender);
  if (!capability)
    throw new Error('This window has no photo: it left the viewer, or its page crashed.');
  askedForPhoto.add(sender);
  if (chosenTransport === 'ipc')
    return { name: capability.name, type: capability.type, bytes: await fs.promises.readFile(capability.filePath) };
  return { name: capability.name, type: capability.type, url: photoUrl(capability) };
}

/**
 * The answer to a request for a photo's URL: its file's stream, for the viewer's page, or an error status.
 * protocol.handle gets no Origin header from Chromium, only the request's mode and referrer. The referrer, which
 * Chromium sets from the page that asks and which a page cannot set to another origin, must be the viewer's. The
 * request must be a CORS one, so that Chromium's own check, which the answer passes for the viewer's origin alone,
 * keeps any other page from reading it. The token is read from the address as a text (pathOfAddress).
 */
export async function respondToPhotoRequest(request: Request): Promise<Response> {
  const token = pathOfAddress(request.url, photoOrigin);
  const capability = token === undefined ? undefined : capabilitiesByToken.get(token);
  if (!capability)
    return new Response(null, { status: 404 });
  if (request.mode !== 'cors' || !isViewerPage(request.referrer))
    return new Response(null, { status: 403 });
  let file: Response;
  try {
    // Past any handler of file: URLs that protocol.handle may have: the app's own, which it had until the main
    // window's page got its photos from plm-file:, could not read a path with "#" in it, as it decoded with decodeURI.
    file = await net.fetch(pathToFileURL(capability.filePath).href, { bypassCustomProtocolHandlers: true });
  } catch (error) {
    logger.warn(logged`The photo of Photo Data Viewer's window could not be read: ${error as Error}`);
    return new Response(null, { status: 404 });
  }
  // TL;DR: The answer is net.fetch's own, with the photo's headers in place of the file's, so that the photo is sent
  // as the files of the main window's page are (app-page.ts), not streamed through JavaScript.
  // Details: protocol.handle relays the body of an answer that is still net.fetch's, unread, without JavaScript, and
  // streams the body of any other answer through it (relayUntouchedFetch in Electron's lib/browser/api/protocol.ts);
  // either way, it sends the answer's status and headers. The photo was first put in a Response of its own, which
  // took the stream, as the page's files did when one run of the e2e suite on Windows CI went without styles.css. The
  // file's headers are removed: its type by the extension, which the photo's replaces, and its Last-Modified time,
  // which CORS would let the viewer's page read, and which the page does not need.
  for (const name of [...file.headers.keys()])
    file.headers.delete(name);
  file.headers.set('content-type', capability.type || 'application/octet-stream');
  file.headers.set('access-control-allow-origin', viewerOrigin());
  file.headers.set('cache-control', 'no-store');
  return file;
}
