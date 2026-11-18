import { session } from 'electron';
import { createPrependedLogger } from '../../src-shared/log/create-prepended-logger.js';
import { LiveReload } from '../live-reload.js';
import { appPageUrl, serveAppPage } from './app-page.js';
import { devServerPageContentSecurityPolicy } from './content-security-policy.js';

const fileServerLogger = createPrependedLogger('[File Server]');

export async function getUrlForMainWindow(): Promise<string> {
  if (LiveReload.enabled) {
    const url = `http://localhost:4200`;
    fileServerLogger.info(`isLiveReloadMode === true, so "ng serve" command runs the server for ${url}`);
    sendContentSecurityPolicyWithDevServer(url);
    return url;
  }

  // The page in the app's folder (app.asar in a package), from a scheme of the app's own (app-page.ts), answered before
  // the window loads it.
  serveAppPage();
  fileServerLogger.info(`isLiveReloadMode === false, so the app's page is served from ${appPageUrl}`);
  return appPageUrl;
}

/**
 * Gives each answer of ng serve at `origin` the page's Content Security Policy, which the handler of plm-app: sends
 * with the app's page, so that live reload runs the page under the policy of a release, but for ng serve's own client
 * (content-security-policy.ts). Electron keeps one such listener per session; the app has no other.
 */
function sendContentSecurityPolicyWithDevServer(origin: string): void {
  session.defaultSession.webRequest.onHeadersReceived({ urls: [`${origin}/*`] }, (details, callback) => {
    const responseHeaders = Object.fromEntries(Object.entries(details.responseHeaders ?? {})
      .filter(([name]) => name.toLowerCase() !== 'content-security-policy'));
    callback({ responseHeaders: { ...responseHeaders, 'Content-Security-Policy': [devServerPageContentSecurityPolicy] } });
  });
}
