import { IpcConstants } from '../../src-shared/ipc/ipc-constants';
import { Logger } from '../../src-shared/log/logger';
import { ProxyRequire } from '../../src-shared/require/proxy-require';

const ipcRenderer = ProxyRequire.electron.ipcRenderer;

ipcRenderer.on(IpcConstants.WelcomeDialog.Name, () => {
  Logger.debug(`[IPC Renderer Received] Name: ${IpcConstants.WelcomeDialog.Name}`);
  window.plmInternalRenderer.welcomeDialog.showWelcomeDialog();
});
