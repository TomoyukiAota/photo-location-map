import { IpcConstants } from '../../src-shared/ipc/ipc-constants';
import { Logger } from '../../src-shared/log/logger';
import { ProxyRequire } from '../../src-shared/require/proxy-require';

const ipcRenderer = ProxyRequire.electron.ipcRenderer;

ipcRenderer.on(IpcConstants.Map.ChangeEvent.Name, (event, ipcMapChangeArg) => {
  Logger.debug(`[IPC Renderer Received] Name: ${IpcConstants.Map.ChangeEvent.Name}, Arg: ${ipcMapChangeArg}`);
  window.plmInternalRenderer.map.changeMap(ipcMapChangeArg);
});
