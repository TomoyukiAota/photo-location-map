import { IpcConstants } from '../../src-shared/ipc/ipc-constants';
import { Logger } from '../../src-shared/log/logger';
import { ConditionalRequire } from '../../src-shared/require/conditional-require';

const ipcRenderer = ConditionalRequire.electron.ipcRenderer;

ipcRenderer.on(IpcConstants.Map.ChangeEvent.Name, (event, ipcMapChangeArg) => {
  Logger.debug(`[IPC Renderer Received] Name: ${IpcConstants.Map.ChangeEvent.Name}, Arg: ${ipcMapChangeArg}`);
  window.plmInternalRenderer.map.changeMap(ipcMapChangeArg);
});
