// The app, which src/main.ts loads once the page has its bridge to the main process.
import 'reflect-metadata';
import './analytics-setup';

import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

import { recordUnhandledError } from '../src-shared/analytics/record-error';
import { currentLanguage, t } from '../src-shared/i18n/i18n';
import { getLanguage } from '../src-shared/i18n/languages';
import { LogFileConfig } from '../src-shared/log/file-config/log-file-config';
import { Logger } from '../src-shared/log/logger';
import { perfMark } from '../src-shared/perf/perf-mark';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { initializeRasterTileBaseLayerConfigs } from './app/map/leaflet-map/raster-tile-base-layer-configs-version-1';
import { recordErrorsOutsideAngular } from './app/shared/error/analytics-error-handler';
import { AppConfig } from './environments/environment';
import './ipc-renderer-setup/ipc-renderer-all-setup';

/** Shows the page in the application's language, as far as it is shown before Angular renders it. */
function applyLanguageToPage(): void {
  // Chromium chooses the glyphs of Japanese and Chinese, which share code points, by the page's language.
  document.documentElement.lang = currentLanguage;
  // The page is laid out from the side that the language is written from: Arabic and Hebrew start at the right, where
  // the sidebar then is. Angular Material reads the direction from here as well, for its dialogs and menus.
  document.documentElement.dir = getLanguage(currentLanguage).direction;
  // The text of index.html, which stays while the map's base layers are fetched.
  const loadingText = document.getElementById('app-loading-text');
  if (loadingText)
    loadingText.textContent = t('app.loading');
}

/** Starts the renderer: the page's language, the map's base layers, the error listeners, then Angular. */
async function bootstrap(): Promise<void> {
  perfMark('renderer:bootstrap-start');
  applyLanguageToPage();
  // Load map choices before Angular creates the map, as the former module await did.
  await initializeRasterTileBaseLayerConfigs();

  if (AppConfig.production) {
    enableProdMode();
  }

  recordErrorsOutsideAngular();

  await bootstrapApplication(AppComponent, appConfig);
  perfMark('renderer:bootstrap-done');

  Logger.info('Content on the main window is loading...');
  Logger.info(`Log File Location: ${LogFileConfig.filePath}`);
}

// TL;DR: A start that fails is logged, and recorded for analytics as an error that nothing handled.
// Details: The user then sees the loading text and nothing else. The listeners that record such errors
// (recordErrorsOutsideAngular) are set during the start, so a failure before them, as of the map's base layers,
// was only in the log file of the user's computer. The log file gets the message alone, so the error's stack is in it.
bootstrap().catch(error => {
  Logger.errorNotRecorded(`The renderer failed to bootstrap: ${error instanceof Error ? error.stack ?? error.message : error}`, error);
  recordUnhandledError(error, 'Renderer');
});
