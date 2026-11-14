import { createPrependedLogger } from '../../src-shared/log/create-prepended-logger.js';
import { LiveReload } from '../live-reload.js';
import { appPageUrl, serveAppPage } from './app-page.js';

const fileServerLogger = createPrependedLogger('[File Server]');

export async function getUrlForMainWindow(): Promise<string> {
  if (LiveReload.enabled) {
    const url = `http://localhost:4200`;
    fileServerLogger.info(`isLiveReloadMode === true, so "ng serve" command runs the server for ${url}`);
    return url;
  }

  // The page in the app's folder (app.asar in a package), from a scheme of the app's own (app-page.ts), answered before
  // the window loads it.
  serveAppPage();
  fileServerLogger.info(`isLiveReloadMode === false, so the app's page is served from ${appPageUrl}`);
  return appPageUrl;
}
