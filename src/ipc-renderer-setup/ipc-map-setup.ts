import { IpcConstants } from '../../src-shared/ipc/ipc-constants';
import { ConditionalRequire } from '../../src-shared/require/conditional-require';

const ipcRenderer = ConditionalRequire.electron.ipcRenderer;

ipcRenderer.on(IpcConstants.Map.ChangeEvent.Name, (event, ipcMapChangeArg) => {
  console.log(ipcMapChangeArg);
});
