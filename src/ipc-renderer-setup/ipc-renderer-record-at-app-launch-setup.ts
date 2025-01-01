import { IpcConstants } from '../../src-shared/ipc/ipc-constants';
import { Logger } from '../../src-shared/log/logger';
import { ProxyRequire } from '../../src-shared/require/proxy-require';
import {
  handleRecordAtAppLaunchFinishedWithRetry
} from '../global-variables/handle-record-at-app-launch-finished-with-retry';

const ipcRenderer = ProxyRequire.electron.ipcRenderer;

ipcRenderer.on(IpcConstants.RecordAtAppLaunch.Finished, () => {
  Logger.debug(`[IPC Renderer Received] ${IpcConstants.RecordAtAppLaunch.Finished}`);
  handleRecordAtAppLaunchFinishedWithRetry();
});
