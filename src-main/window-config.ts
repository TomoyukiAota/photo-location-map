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
    Analytics.trackEvent('Main Window at App Launch', 'Main Window: isFirstLaunch', `isFirstLaunch: ${isFirstLaunch}, so width and height are defaulted to ${defaultConfig.defaultWidth}x${defaultConfig.defaultHeight}`);
    Analytics.trackEvent('Main Window at App Launch (1st time)', 'Main Window: Dimensions', `Window Dimensions: ${mainWindowState.width}x${mainWindowState.height}`);
    Analytics.trackEvent('Main Window at App Launch (1st time)', 'Main Window: XY coordinates', `XY coordinates: (${mainWindowState.x}, ${mainWindowState.y})`);
    Analytics.trackEvent('Main Window at App Launch (1st time)', 'Main Window: isFullScreen', `isFullScreen: ${mainWindowState.isFullScreen}`);
    Analytics.trackEvent('Main Window at App Launch (1st time)', 'Main Window: isMaximized', `isMaximized: ${mainWindowState.isMaximized}`);
    Logger.info(`[Main Window at App Launch] This is the first launch, so width and height are defaulted to ${defaultConfig.defaultWidth}x${defaultConfig.defaultHeight}`);
  } else {
    Analytics.trackEvent('Main Window at App Launch', 'Main Window: isFirstLaunch', `isFirstLaunch: ${isFirstLaunch}`);
    Analytics.trackEvent('Main Window at App Launch (>= 2nd time)', 'Main Window: Dimensions', `Window Dimensions: ${mainWindowState.width}x${mainWindowState.height}`);
    Analytics.trackEvent('Main Window at App Launch (>= 2nd time)', 'Main Window: XY coordinates', `XY coordinates: (${mainWindowState.x}, ${mainWindowState.y})`);
    Analytics.trackEvent('Main Window at App Launch (>= 2nd time)', 'Main Window: isFullScreen', `isFullScreen: ${mainWindowState.isFullScreen}`);
    Analytics.trackEvent('Main Window at App Launch (>= 2nd time)', 'Main Window: isMaximized', `isMaximized: ${mainWindowState.isMaximized}`);
    Logger.info(`[Main Window at App Launch] This is not the first launch, so width and height are the ones previously saved.`);
  }

  Logger.info(`[Main Window at App Launch] Window Dimensions: ${mainWindowState.width}x${mainWindowState.height}`);
  Logger.info(`[Main Window at App Launch] XY coordinates: (${mainWindowState.x}, ${mainWindowState.y})`);
  Logger.info(`[Main Window at App Launch] isFullScreen: ${mainWindowState.isFullScreen}`);
  Logger.info(`[Main Window at App Launch] isMaximized: ${mainWindowState.isMaximized}`);
}
