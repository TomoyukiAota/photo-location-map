import { IpcConstants } from '../../src-shared/ipc/ipc-constants';
import { Logger } from '../../src-shared/log/logger';
import { ProxyRequire } from '../../src-shared/require/proxy-require';

const ipcRenderer = ProxyRequire.electron.ipcRenderer;

ipcRenderer.on(IpcConstants.PhotoSelection.Undo, () => {
  Logger.debug(`[IPC Renderer Received] ${IpcConstants.PhotoSelection.Undo}`);
  window.plmInternalRenderer.photoSelection.undo();
});

ipcRenderer.on(IpcConstants.PhotoSelection.Redo, () => {
  Logger.debug(`[IPC Renderer Received] ${IpcConstants.PhotoSelection.Redo}`);
  window.plmInternalRenderer.photoSelection.redo();
});
