import { shell } from 'electron';
import { Analytics } from '../../../../src-shared/analytics/analytics';
import { Logger } from '../../../../src-shared/log/logger';

export function openUrl(url: string, urlDescription: string, from: string): void {
  // noinspection JSIgnoredPromiseFromCall
  shell.openExternal(url);
  Logger.info(`[${from}] Opened URL for ${urlDescription} - ${url}`);
  Analytics.trackEvent(`[${from}] Opened URL for ${urlDescription}`, url);
}
