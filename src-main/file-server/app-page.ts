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
  return withContentSecurityPolicy(file);
}

/**
 * `response` with the page's Content Security Policy (content-security-policy.ts). Each file of the page has it: the
 * policy applies to the document that index.html is, and would apply to a worker by its script's answer.
 */
function withContentSecurityPolicy(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set('Content-Security-Policy', mainWindowContentSecurityPolicy);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function notFound(): Response {
  return new Response(null, { status: 404 });
}
