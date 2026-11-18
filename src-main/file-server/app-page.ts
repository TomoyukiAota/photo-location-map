import { app, net, protocol } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';
import { appPageOrigin, appPageScheme } from '../../src-shared/main-window-schemes.js';
import { mainWindowContentSecurityPolicy } from './content-security-policy.js';

// TL;DR: The main window's page is served from plm-app://app/, a scheme of the application's own, not from file:.
// Details: Electron gives a page of file: privileges that no browser gives a page, which the package turns off with the
// fuse grantFileProtocolExtraPrivileges (docs/contributing/electron-fuses.md); without them, a page of file: whose
// scripts are modules does not start. A server on http, tried in October 2022, met ports that Windows Update had
// taken: a scheme takes no port. The page gets the user's photos from plm-file: (photo-files.ts).

/** The address of the app's page. */
export const appPageUrl = `${appPageOrigin}/index.html`;
const appPageHost = new URL(appPageUrl).host;

/** Answers the requests for the app's page from now on, once, however often the main window is made. */
export function serveAppPage(distFolder = path.join(app.getAppPath(), 'dist')): void {
  if (!protocol.isProtocolHandled(appPageScheme))
    protocol.handle(appPageScheme, request => respondToAppPageRequest(request, distFolder));
}

/**
 * A file of the app's build, in `distFolder` (dist/ in the app's folder, app.asar in a package), for a request of its
 * page: only a file in that folder, and only to be read.
 */
export async function respondToAppPageRequest(request: Request, distFolder: string): Promise<Response> {
  if (request.method !== 'GET')
    return new Response(null, { status: 405 });

  let filePath: string;
  try {
    const url = new URL(request.url);
    if (url.host !== appPageHost)
      return notFound();
    filePath = path.join(distFolder, decodeURIComponent(url.pathname));
  } catch {
    return notFound(); // An address that is not one, or whose escapes are not.
  }

  // A path that leaves the folder, as with an escaped "..\" on Windows, is not answered.
  const relative = path.relative(distFolder, filePath);
  if (!relative || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative))
    return notFound();
  const isFile = await fs.promises.stat(filePath).then(stats => stats.isFile(), () => false);
  if (!isFile)
    return notFound();
  // Past any handler of file: URLs that protocol.handle may have, as photo-delivery.ts goes.
  const file = await net.fetch(pathToFileURL(filePath).href, { bypassCustomProtocolHandlers: true });
  // TL;DR: The answer is net.fetch's own, with the page's Content Security Policy (content-security-policy.ts) added
  // to its headers, so that the files of the page are sent as they were before the policy.
  // Details: protocol.handle has the network service send the file of an answer that is still net.fetch's, unread,
  // and streams the body of any other answer through JavaScript (relayUntouchedFetch in Electron's
  // lib/browser/api/protocol.ts); either way, it takes the answer's headers. The policy's first version put the body
  // in a Response of its own, which sent every file of the page through that stream, and in one run of the e2e suite
  // on Windows CI, the page then went without styles.css: the map's tile containers, which Leaflet's CSS there lets
  // the mouse pass through, took a click. Why was not found, as 150 launches on macOS applied it each time, so the
  // files go as they did. Each file has the policy: it applies to the document that index.html is, and would apply to
  // a worker by its script's answer.
  file.headers.set('Content-Security-Policy', mainWindowContentSecurityPolicy);
  return file;
}

function notFound(): Response {
  return new Response(null, { status: 404 });
}
