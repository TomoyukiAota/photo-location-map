import { app, ipcMain } from 'electron';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants';
import { createStartupMetadata } from '../../src-shared/startup/startup-metadata';

// The renderer asks for this synchronously while its modules are evaluated (src-shared/startup/startup-metadata.ts).
ipcMain.on(IpcConstants.StartupMetadata.Get, event => {
  event.returnValue = createStartupMetadata(app);
});
