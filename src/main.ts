import { enableProdMode, provideCheckNoChangesConfig, provideZonelessChangeDetection } from '@angular/core';
import { platformBrowser } from '@angular/platform-browser';

import { LogFileConfig } from '../src-shared/log/file-config/log-file-config';
import { Logger } from '../src-shared/log/logger';
import { AppModule } from './app/app.module';
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

  await platformBrowser().bootstrapModule(AppModule, {
    applicationProviders: [
      // Without Zone.js, Angular renders what signals, template events, markForCheck() and the like tell it about.
      provideZonelessChangeDetection(),
      // Development builds check every view each second for a binding that changed without telling Angular, which
      // would not be rendered. Angular reports one as NG0100 (ExpressionChangedAfterItHasBeenCheckedError) to the
      // ErrorHandler, which logs it.
      ...(AppConfig.production ? [] : [provideCheckNoChangesConfig({ exhaustive: true, interval: 1000 })]),
    ],
    preserveWhitespaces: false
  });

  Logger.info('Content on the main window is loading...');
  Logger.info(`Log File Location: ${LogFileConfig.filePath}`);
}

bootstrap().catch(err => Logger.error(err));
