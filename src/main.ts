import 'reflect-metadata';

import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

import { LogFileConfig } from '../src-shared/log/file-config/log-file-config';
import { Logger } from '../src-shared/log/logger';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { initializeRasterTileBaseLayerConfigs } from './app/map/leaflet-map/raster-tile-base-layer-configs-version-1';
import { recordErrorsOutsideAngular } from './app/shared/error/analytics-error-handler';
import { AppConfig } from './environments/environment';
import './ipc-renderer-setup/ipc-renderer-all-setup';

/** Starts the renderer: the map's base layers, the error listeners, then Angular. */
async function bootstrap(): Promise<void> {
  // Load map choices before Angular creates the map, as the former module await did.
  await initializeRasterTileBaseLayerConfigs();

  if (AppConfig.production) {
    enableProdMode();
  }

  recordErrorsOutsideAngular();

  await bootstrapApplication(AppComponent, appConfig);

  Logger.info('Content on the main window is loading...');
  Logger.info(`Log File Location: ${LogFileConfig.filePath}`);
}

bootstrap().catch(err => Logger.error(err));
