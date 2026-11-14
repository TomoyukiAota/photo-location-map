import { Analytics } from '../../src-shared/analytics/analytics.js';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants.js';
import { Logger } from '../../src-shared/log/logger.js';
import { mainWindow } from '../electron-main.js';

export const handleAboutMenuClicked = () => {
  Logger.info(`[Main Window Menu] Clicked "About Photo Location Map".`);
  Analytics.trackEvent('Main Window Menu', 'Clicked "About Photo Location Map"');

  if (!mainWindow)
    return;

  mainWindow.webContents.send(IpcConstants.AboutBox.Name);
};
