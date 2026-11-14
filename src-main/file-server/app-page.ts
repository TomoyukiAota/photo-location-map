import { app, net, protocol } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';

// TL;DR: The main window's page is served from plm-app://app/, a scheme of the application's own, not from file:.
// Details: Electron gives a page of file: privileges that no browser gives a page, which the package turns off with the
// fuse grantFileProtocolExtraPrivileges (docs/contributing/electron-fuses.md); without them, a page of file: whose
// scripts are modules does not start. A server on http, tried in October 2022, met ports that Windows Update had
// taken: a scheme takes no port. The page still shows the photos from their file: URLs, as the window's webSecurity
// is off (electron-util/electron-web-preferences.js).

/** The scheme of the app's page, which src-main/privileged-schemes-setup.ts registers with its privileges. */
export const appPageScheme = 'plm-app';
const appPageHost = 'app';

/** The address of the app's page. */
export const appPageUrl = `${appPageScheme}://${appPageHost}/index.html`;

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
  // Past the app's own handler of file: URLs (src-main/electron-main.ts), as photo-delivery.ts goes.
  return net.fetch(pathToFileURL(filePath).href, { bypassCustomProtocolHandlers: true });
}

function notFound(): Response {
  return new Response(null, { status: 404 });
}
