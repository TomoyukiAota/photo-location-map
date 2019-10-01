import { IpcConstants } from '../../src-shared/ipc/ipc-constants';
import { Logger } from '../../src-shared/log/logger';
import { mainWindow } from '../electron-main';

export const handleAboutMenuClicked = () => {
  Logger.info(`[Menu] Clicked "About Photo Location Map".`);

  if (!mainWindow)
    return;

  mainWindow.webContents.send(IpcConstants.AboutBox.Name);
};
