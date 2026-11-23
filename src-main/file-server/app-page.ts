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
import { appPageInLanguage } from './app-page-language.js';
import { mainWindowContentSecurityPolicy } from './content-security-policy.js';

// TL;DR: The main window's page is served from plm-app://app/, a scheme of the application's own, not from file:.
// Details: Electron gives a page of file: privileges that no browser gives a page, which the package turns off with the
// fuse grantFileProtocolExtraPrivileges (docs/contributing/electron-fuses.md); without them, a page of file: whose
// scripts are modules does not start. A server on http, tried in October 2022, met ports that Windows Update had
// taken: a scheme takes no port. The page gets the user's photos from plm-file: (photo-files.ts).

/** The address of the app's page. */
export const appPageUrl = `${appPageOrigin}/index.html`;
const appPageHost = new URL(appPageUrl).host;
const appPageLogger = createPrependedLogger('[App Page]');
/** How many requests of the page the handler is answering, for the line of one that is not answered. */
let requestsBeingAnswered = 0;

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

  let filePath: string;
  try {
    const url = new URL(request.url);
    if (url.host !== appPageHost)
      return notFound(request, 'its host is not the page\'s');
    filePath = path.join(distFolder, decodeURIComponent(url.pathname));
  } catch {
    return notFound(request, 'its address, or an escape in it, is not one');
  }

  // A path that leaves the folder, as with an escaped "..\" on Windows, is not answered.
  const relative = path.relative(distFolder, filePath);
  if (!relative || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative))
    return notFound(request, 'its path is not of a file in the build');
  requestsBeingAnswered++;
  try {
    return await respondWithFile(filePath, relative, language);
  } finally {
    requestsBeingAnswered--;
  }
}

/** The file at `filePath`, `relative` in the build, for a request of the page: 404 when it is not a file. */
async function respondWithFile(filePath: string, relative: string, language: LanguageCode): Promise<Response> {
  // TL;DR: A file that stat does not find is answered with 404, and logged with what tells why (logNotFound), as the
  // page went without one of its files now and then on Windows CI, for a reason not found yet.
  // Details:
  // - What happened: from 2026-11-18, six runs of the e2e suite on Windows CI in about 550 failed so, four of them on
  //   2026-11-23, each at one launch of the packaged app, most of them the first launch of a case. Twice main.js was
  //   answered with 404, which left the home view unrendered; as far as the cases' failures tell, the other four went
  //   without scripts.js (the map had no drawing toolbar) or styles.css (Leaflet-Geoman's buttons showed, and the
  //   map's tile containers took a click). The suite now fails such a launch at once, with what is logged here
  //   (launch in test/e2e/regression.spec.mjs).
  // - The 404 is this handler's: Electron answers a handler that throws with net::ERR_UNEXPECTED, and net.fetch of a
  //   file of the archive that cannot be read rejects (AsarURLLoader's net::ERR_FILE_NOT_FOUND); nothing else in
  //   Electron answers 404. Of the ways here to a 404, only this stat depends on more than the address.
  // - Ruled out by Electron 45.3.2's source: fs.promises.stat of a path in app.asar reads nothing from the disk, but
  //   looks the path up in the archive's header, which the main process has held since it loaded its own code from
  //   the archive (lib/node/asar-fs-wrapper.ts, shell/common/asar/archive.cc), so a lock on the file or a scan of it
  //   cannot make it fail. It fails for an archive that cannot be opened, which then is not kept, or with asar support
  //   off (process.noAsar), which Electron turns on only during child_process.exec and execSync, which return before
  //   anything else runs, and which the main process does not call.
  // - Ruled out by measurement: 1,902 launches of the package on Windows CI, each followed by 120 fetches of the page's
  //   files from the page and 450 stats and 90 requests of them from the main process, all at once, got every file.
  //   So did 200,000 stats at once of the files in an archive on macOS. The page's first load in a launch is what
  //   goes without a file.
  // Undefined for a file, and otherwise why it is not answered: what stat threw, or that it is not a file.
  const notAFile = await fs.promises.stat(filePath)
    .then(stats => stats.isFile() ? undefined : shown('it is not a file'), (error: unknown) => error ?? shown('stat failed'));
  if (notAFile !== undefined) {
    logNotFound(filePath, relative, notAFile);
    return notFound();
  }
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
  // the mouse pass through, took a click. Why was not found, as 150 launches on macOS applied it each time, so the
  // files go as they did. The page has gone without a file since, with net.fetch's own answer too, so the stream was
  // not the cause, or not the only one (see the start of this function). Each file has the policy: it applies to the
  // document that index.html is, and would apply to a worker by its script's answer. index.html alone is a Response
  // of its own (pageInLanguage), whose body is a string of the size of the page, not a file read as it is sent.
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

/** The answer of 404, for `request`, if given, which is logged with `reason`. */
function notFound(request?: Request, reason?: string): Response {
  if (request)
    appPageLogger.info(`${request.url.slice(0, 200)} is answered with 404, as ${reason}.`);
  return new Response(null, { status: 404 });
}

/**
 * Logs why the file at `filePath`, `relative` in the build, is answered with 404: `reason`, what stat threw or that
 * it is not a file. It is looked at again at once, which tells a file that is missing, logged as information, from one
 * that stat did not find for a moment, logged as an error.
 */
function logNotFound(filePath: string, relative: string, reason: unknown): void {
  let isFileNow = false;
  let again: unknown;
  try {
    isFileNow = fs.statSync(filePath).isFile();
    again = shown(isFileNow ? 'a file' : 'not a file');
  } catch (error) {
    again = error;
  }
  const noAsar = !!process.noAsar;
  const uptime = Math.round(process.uptime() * 1000);
  const line = logged`${shown(relative)} is answered with 404, as ${reason}. Again at once: ${again}. noAsar: ${noAsar}, being answered: ${requestsBeingAnswered}, at ${uptime} ms.`;
  if (isFileNow)
    appPageLogger.error(line);
  else
    appPageLogger.info(line);
}
