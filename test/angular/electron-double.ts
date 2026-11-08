// Unit-test platform boundaries only. Genuine Electron behavior is tested by
// Electron-Mocha and Playwright, never by these jsdom construction doubles.
import { EventEmitter } from 'node:events';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';

export const temporaryRoot = mkdtempSync(path.join(tmpdir(), 'plm-vitest-'));
export const app = {
  getVersion: () => '0.0.0-test',
  getPath: (name: string) => path.join(temporaryRoot, name),
  getAppPath: () => temporaryRoot,
};

// The renderer's two synchronous requests: the startup metadata (src-shared/startup/) and the log file's location.
export const ipcRenderer = Object.assign(new EventEmitter(), {
  send: () => {},
  sendSync: (channel: string) => channel === 'ipc-constants-get-startup-metadata'
    ? { version: app.getVersion(), userDataPath: app.getPath('userData') }
    : { dirName: temporaryRoot, fileName: 'test.log', filePath: path.join(temporaryRoot, 'test.log') },
  // The folder picker, which the main process shows, is canceled.
  invoke: async (channel: string) => channel === 'ipc-constants-show-folder-dialog' ? { canceled: true, filePaths: [] } : undefined,
});
export const shell = { openExternal: async () => {}, openPath: async () => '' };
export const cleanup = () => rmSync(temporaryRoot, { recursive: true, force: true });
