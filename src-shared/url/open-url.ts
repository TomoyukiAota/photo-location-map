import { Analytics } from '../analytics/analytics.js';
import { bridge } from '../bridge/plm-bridge.js';
import { Logger } from '../log/logger.js';
import { logged, shown } from '../log/logged-line.js';

let mainProcessOpener: ((url: string) => Promise<void>) | undefined;

/** Sets how the main process opens a URL, shell.openExternal (src-main/shell/); a renderer asks the main process. */
export function setUrlOpener(opener: (url: string) => Promise<void>): void {
  mainProcessOpener = opener;
}

/** Opens a web page in the OS browser, and records which. */
export function openUrl(url: string, urlDescription: string, from: string, urlForAnalytics = url): void {
  const opener = mainProcessOpener ?? (async (urlToOpen: string) => bridge().shell.openExternal(urlToOpen));
  opener(url).catch(error => Logger.error(logged`[${shown(from)}] Failed to open URL for ${shown(urlDescription)} - ${url}`, error));
  Logger.info(`[${from}] Opened URL for ${urlDescription} - ${url}`);
  Analytics.trackEvent(`Opened URL`, `Opened URL`, `[${from}] Opened URL for ${urlDescription}`, urlForAnalytics);
}
