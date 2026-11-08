import { app, ipcMain } from 'electron';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants';
import { UserDataStorage } from '../../src-shared/user-data-storage/user-data-storage';
import { FileUserDataStorage } from './file-user-data-storage';
import { rendererStorageSnapshot, writeFromRenderer } from './renderer-storage-requests';

// TL;DR: The main process owns the settings' files. Imported right after the test profile, before anything reads them.
// Details: Several modules read settings while they are evaluated (currentUserSettings, and analytics through the
// error handlers), so the files must be the storage before those modules are imported (electron-main.ts).
const files = new FileUserDataStorage(app);
UserDataStorage.useBackend(files);

// A renderer asks for its copy synchronously, when it first reads a setting (renderer-user-data-storage.ts).
ipcMain.on(IpcConstants.UserDataStorage.Snapshot, event => {
  event.returnValue = rendererStorageSnapshot(files);
});

// A write is handled at once and in the order sent: a renderer's later reads and a quit come after it.
ipcMain.handle(IpcConstants.UserDataStorage.Write, (_event, storagePath: unknown, value: unknown) => writeFromRenderer(storagePath, value));
