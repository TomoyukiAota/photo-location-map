import { Analytics } from '../../src-shared/analytics/analytics';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants';
import { Logger } from '../../src-shared/log/logger';
import { mainWindow } from '../electron-main';

export const handleAboutMenuClicked = () => {
  Logger.info(`[Main Window Menu] Clicked "About Photo Location Map".`);
  Analytics.trackEvent('Main Window Menu', 'Clicked "About Photo Location Map"');

  if (!mainWindow)
    return;

  mainWindow.webContents.send(IpcConstants.AboutBox.Name);
};
