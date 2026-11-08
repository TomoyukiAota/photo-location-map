import { Analytics } from '../analytics/analytics';
import { bridge } from '../bridge/plm-bridge';
import { Logger } from '../log/logger';

let mainProcessOpener: ((url: string) => Promise<void>) | undefined;

/** Sets how the main process opens a URL, shell.openExternal (src-main/shell/); a renderer asks the main process. */
export function setUrlOpener(opener: (url: string) => Promise<void>): void {
  mainProcessOpener = opener;
}

/** Opens a web page in the OS browser, and records which. */
export function openUrl(url: string, urlDescription: string, from: string, urlForAnalytics = url): void {
  const opener = mainProcessOpener ?? (urlToOpen => bridge().shell.openExternal(urlToOpen));
  opener(url).catch(error => Logger.error(`[${from}] Failed to open URL for ${urlDescription} - ${url}`, error));
  Logger.info(`[${from}] Opened URL for ${urlDescription} - ${url}`);
  Analytics.trackEvent(`Opened URL`, `Opened URL`, `[${from}] Opened URL for ${urlDescription}`, urlForAnalytics);
}
