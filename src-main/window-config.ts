import { screen } from 'electron';
import * as windowStateKeeper from 'electron-window-state';
import { Analytics } from '../src-shared/analytics/analytics';
import { Logger } from '../src-shared/log/logger';
import { LaunchInfo } from './launch-info';

const defaultConfig = {
  defaultWidth: 1000,
  defaultHeight: 800
};

let mainWindowState: ReturnType<typeof import('electron-window-state')>;

export function createMainWindowState() {
  mainWindowState = windowStateKeeper(defaultConfig);   // Load the previous main window state with fallback to defaults
  return mainWindowState;
}

export function recordWindowState(): void {
  const isFirstLaunch = LaunchInfo.isFirstLaunch;
  if (isFirstLaunch) {
    Analytics.trackEvent('Window at App Launch', 'isFirstLaunch', `${isFirstLaunch}, so width and height are defaulted to ${defaultConfig.defaultWidth}x${defaultConfig.defaultHeight}`);
    Analytics.trackEvent('Window at App Launch (1st time)', 'Window Dimensions', `${mainWindowState.width}x${mainWindowState.height}`);
    Analytics.trackEvent('Window at App Launch (1st time)', 'XY coordinates', `(${mainWindowState.x}, ${mainWindowState.y})`);
    Analytics.trackEvent('Window at App Launch (1st time)', 'isFullScreen', `${mainWindowState.isFullScreen}`);
    Analytics.trackEvent('Window at App Launch (1st time)', 'isMaximized', `${mainWindowState.isMaximized}`);
    Logger.info(`[Window at App Launch] This is the first launch, so width and height are defaulted to ${defaultConfig.defaultWidth}x${defaultConfig.defaultHeight}`);
  } else {
    Analytics.trackEvent('Window at App Launch', 'isFirstLaunch', `${isFirstLaunch}`);
    Analytics.trackEvent('Window at App Launch (>= 2nd time)', 'Window Dimensions', `${mainWindowState.width}x${mainWindowState.height}`);
    Analytics.trackEvent('Window at App Launch (>= 2nd time)', 'XY coordinates', `(${mainWindowState.x}, ${mainWindowState.y})`);
    Analytics.trackEvent('Window at App Launch (>= 2nd time)', 'isFullScreen', `${mainWindowState.isFullScreen}`);
    Analytics.trackEvent('Window at App Launch (>= 2nd time)', 'isMaximized', `${mainWindowState.isMaximized}`);
    Logger.info(`[Window at App Launch] This is not the first launch, so width and height are the ones previously saved.`);
  }

  Logger.info(`[Window at App Launch] Window Dimensions: ${mainWindowState.width}x${mainWindowState.height}`);
  Logger.info(`[Window at App Launch] XY coordinates: (${mainWindowState.x}, ${mainWindowState.y})`);
  Logger.info(`[Window at App Launch] isFullScreen: ${mainWindowState.isFullScreen}`);
  Logger.info(`[Window at App Launch] isMaximized: ${mainWindowState.isMaximized}`);
}
