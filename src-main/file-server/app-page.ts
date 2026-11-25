import { app, net, protocol } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';
import { currentLanguage } from '../../src-shared/i18n/i18n.js';
import type { LanguageCode } from '../../src-shared/i18n/languages.js';
import { createPrependedLogger } from '../../src-shared/log/create-prepended-logger.js';
import { logged, shown } from '../../src-shared/log/logged-line.js';
import { Logger } from '../../src-shared/log/logger.js';
import { appPageOrigin, appPageScheme } from '../../src-shared/main-window-schemes.js';
import { pathOfAddress } from '../../src-shared/url/address-path.js';
import { appPageInLanguage } from './app-page-language.js';
import { mainWindowContentSecurityPolicy } from './content-security-policy.js';

// TL;DR: The main window's page is served from plm-app://app/, a scheme of the application's own, not from file:.
// Details: Electron gives a page of file: privileges that no browser gives a page, which the package turns off with the
// fuse grantFileProtocolExtraPrivileges (docs/contributing/electron-fuses.md); without them, a page of file: whose
// scripts are modules does not start. A server on http, tried in October 2022, met ports that Windows Update had
// taken: a scheme takes no port. The page gets the user's photos from plm-file: (photo-files.ts).

/** The address of the app's page. */
export const appPageUrl = `${appPageOrigin}/index.html`;
const appPageLogger = createPrependedLogger('[App Page]');

/** Answers the requests for the app's page from now on, once, however often the main window is made. */
export function serveAppPage(distFolder = path.join(app.getAppPath(), 'dist')): void {
  if (!protocol.isProtocolHandled(appPageScheme))
    protocol.handle(appPageScheme, request => respondToAppPageRequest(request, distFolder));
}

/**
 * A file of the app's build, in `distFolder` (dist/ in the app's folder, app.asar in a package), for a request of its
 * page: only a file in that folder, and only to be read. The page itself, index.html, is in `language`.
 */
export async function respondToAppPageRequest(request: Request, distFolder: string,
                                              language: LanguageCode = currentLanguage): Promise<Response> {
  if (request.method !== 'GET')
    return new Response(null, { status: 405 });

  // TL;DR: The file's path is read from the request's address as a text (pathOfAddress), and not with Node.js's URL,
  // whose parts were now and then those of another URL in the e2e suite.
  // Details:
  // - What happened: on Windows CI, from 2026-11-18, one launch of the app in a run of the e2e suite now and then
  //   went without a file of its page: main.js, which left the home view unrendered, scripts.js, which left the map
  //   without its drawing toolbar, or styles.css, which left Leaflet-Geoman's buttons visible, in six runs of about 550,
  //   four of them on 2026-11-23. In 16 runs of the suite on Windows CI with each answer of 404 logged, the handler,
  //   which then checked the host of new URL(request.url), answered plm-app://app/scripts.js once and
  //   plm-app://app/chunk-….js once as of another host, both at the first launch of a case, while the suite's launch
  //   evaluated code in the main process.
  // - Why: Node.js's URL (Node.js 24.22.2, in Electron 45.3.2) takes where a URL's host and path start and end from a
  //   buffer that every parse writes (bindingUrl.urlComponents in lib/internal/url.js), and reads it after it has
  //   called another function, where V8 runs what interrupts it. Node.js's inspector runs a debugger's messages there,
  //   in the middle of the code that runs, and Playwright controls the e2e suite's main process through the inspector:
  //   a URL that code evaluated by Playwright parses at that point, as require() of a module does, leaves its parts to
  //   the URL that was being made. On macOS, with an inspector client evaluating new URL() of a file: address, 36 of
  //   2.3 million new URL('plm-app://app/chunk-BCYMLwnQ.js') had the host "" and the path "://app/chunk-BCYMLwnQ.js".
  //   Node.js's main branch reads the buffer in the same way (2026-11-23).
  // - Users do not have it: the package's main process has no inspector, which its fuse enableNodeCliInspectArguments
  //   keeps off (docs/contributing/electron-fuses.md), so nothing runs between a parse and its read. Only the e2e
  //   suite's copy of the package has the fuse on (script/package-test/inspectable-package.js).
  // - Ruled out on the way: stat of a path in app.asar, which looks the path up in the archive's header in memory; and
  //   a race of the requests among themselves, as 1,902 launches on Windows CI, after each of which the page's files
  //   were requested 660 times at once from the page and the main process, got every file.
  const pathInBuild = pathOfAddress(request.url, appPageOrigin);
  if (pathInBuild === undefined)
    return notFound(request, 'it is not an address of the page, or an escape in it is not one');
  const filePath = path.join(distFolder, pathInBuild);

  // A path that leaves the folder, as with an escaped "..\" on Windows, is not answered.
  const relative = path.relative(distFolder, filePath);
  if (!relative || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative))
    return notFound(request, 'its path is not of a file in the build');
  const notAFile = await fs.promises.stat(filePath)
    .then(stats => stats.isFile() ? undefined : 'it is not a file', (error: unknown) => `stat failed: ${String(error)}`);
  if (notAFile !== undefined)
    return notFound(request, notAFile);
  if (relative === 'index.html') {
    const page = await pageInLanguage(filePath, language);
    if (page)
      return page;
  }
  // Past any handler of file: URLs that protocol.handle may have, as photo-delivery.ts goes.
  const file = await net.fetch(pathToFileURL(filePath).href, { bypassCustomProtocolHandlers: true }).catch((error: unknown) => {
    appPageLogger.error(logged`${shown(relative)} of the app's page could not be read: ${error}.`);
    throw error;
  });
  if (!file.ok)
    appPageLogger.error(logged`${shown(relative)} of the app's page was read with the status ${file.status}.`);
  // TL;DR: The answer is net.fetch's own, with the page's Content Security Policy (content-security-policy.ts) added
  // to its headers, so that the files of the page are sent as they were before the policy.
  // Details: protocol.handle has the network service send the file of an answer that is still net.fetch's, unread,
  // and streams the body of any other answer through JavaScript (relayUntouchedFetch in Electron's
  // lib/browser/api/protocol.ts); either way, it takes the answer's headers. The policy's first version put the body
  // in a Response of its own, which sent every file of the page through that stream, and in one run of the e2e suite
  // on Windows CI, the page then went without styles.css: the map's tile containers, which Leaflet's CSS there lets
  // the mouse pass through, took a click. The stream was not why: the address was read wrong, as the comment above
  // tells, which the page met with net.fetch's own answer too. Each file has the policy: it applies to the document
  // that index.html is, and would apply to a worker by its script's answer. index.html alone is a Response of its own
  // (pageInLanguage), whose body is a string of the size of the page, not a file read as it is sent.
  file.headers.set('Content-Security-Policy', mainWindowContentSecurityPolicy);
  return file;
}

/**
 * The page, index.html at `filePath`, in `language` (app-page-language.ts), with the page's Content Security Policy.
 * Undefined when the page cannot be written in it, once that is logged and recorded: the page is then answered as the
 * file is, in English until src/start-app.ts sets its language, rather than not at all.
 */
async function pageInLanguage(filePath: string, language: LanguageCode): Promise<Response | undefined> {
  try {
    const page = appPageInLanguage(await fs.promises.readFile(filePath, 'utf8'), language);
    return new Response(page, { headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': mainWindowContentSecurityPolicy,
    } });
  } catch (error) {
    Logger.error(logged`The app's page could not be written in ${shown(language)}, so it is served as it is.`, error);
    return undefined;
  }
}

/**
 * The answer of 404 to `request`, logged with `reason`, so that a page that went without a file tells why: the page
 * asks only for the files of its build (launch in test/e2e/regression.spec.mjs reports these lines).
 */
function notFound(request: Request, reason: string): Response {
  appPageLogger.info(`${request.url.slice(0, 200)} is answered with 404, as ${reason}.`);
  return new Response(null, { status: 404 });
}
