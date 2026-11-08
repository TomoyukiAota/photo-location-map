import { bridge } from '../../src-shared/bridge/plm-bridge';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants';
import { Logger } from '../../src-shared/log/logger';
import {
  handleRecordAtAppLaunchFinishedWithRetry
} from '../global-variables/handle-record-at-app-launch-finished-with-retry';

// For the app's lifetime: the page never stops listening.
bridge().events.onRecordAtAppLaunchFinished(() => {
  Logger.debug(`[IPC Renderer Received] ${IpcConstants.RecordAtAppLaunch.Finished}`);
  handleRecordAtAppLaunchFinishedWithRetry();
});
