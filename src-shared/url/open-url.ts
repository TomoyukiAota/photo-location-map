import { shell } from 'electron';
import { Analytics } from '../analytics/analytics';
import { Logger } from '../log/logger';

export function openUrl(url: string, urlDescription: string, from: string, urlForAnalytics = url): void {
  // noinspection JSIgnoredPromiseFromCall
  shell.openExternal(url);
  Logger.info(`[${from}] Opened URL for ${urlDescription} - ${url}`);
  Analytics.trackEvent(`Opened URL`, `Opened URL`, `[${from}] Opened URL for ${urlDescription}`, urlForAnalytics);
}
