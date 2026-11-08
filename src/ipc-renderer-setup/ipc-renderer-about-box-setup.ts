import { bridge } from '../../src-shared/bridge/plm-bridge';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants';
import { Logger } from '../../src-shared/log/logger';

// For the app's lifetime: the page never stops listening.
bridge().events.onAboutBox(() => {
  Logger.debug(`[IPC Renderer Received] Name: ${IpcConstants.AboutBox.Name}`);
  window.plmInternalRenderer.aboutBox.showAboutBox();
});
