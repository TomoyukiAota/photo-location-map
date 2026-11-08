import { bridge } from '../../src-shared/bridge/plm-bridge';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants';
import { Logger } from '../../src-shared/log/logger';

// For the app's lifetime: the page never stops listening.
bridge().events.onUndo(() => {
  Logger.debug(`[IPC Renderer Received] ${IpcConstants.PhotoSelection.Undo}`);
  window.plmInternalRenderer.photoSelection.undo();
});

bridge().events.onRedo(() => {
  Logger.debug(`[IPC Renderer Received] ${IpcConstants.PhotoSelection.Redo}`);
  window.plmInternalRenderer.photoSelection.redo();
});
