// The app, which src/main.ts loads once the page has its bridge to the main process.
import 'reflect-metadata';
import './analytics-setup';

import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

import { LogFileConfig } from '../src-shared/log/file-config/log-file-config';
import { Logger } from '../src-shared/log/logger';
import { perfMark } from '../src-shared/perf/perf-mark';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { initializeRasterTileBaseLayerConfigs } from './app/map/leaflet-map/raster-tile-base-layer-configs-version-1';
import { recordErrorsOutsideAngular } from './app/shared/error/analytics-error-handler';
import { AppConfig } from './environments/environment';
import './ipc-renderer-setup/ipc-renderer-all-setup';

/** Starts the renderer: the map's base layers, the error listeners, then Angular. */
async function bootstrap(): Promise<void> {
  perfMark('renderer:bootstrap-start');
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

// The log file gets the message alone, so the error's stack is in it.
bootstrap().catch(error => Logger.error(`The renderer failed to bootstrap: ${error instanceof Error ? error.stack ?? error.message : error}`, error));
