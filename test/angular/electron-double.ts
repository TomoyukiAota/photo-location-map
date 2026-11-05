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

export const ipcRenderer = Object.assign(new EventEmitter(), {
  send: () => {},
  sendSync: () => ({ dirName: temporaryRoot, fileName: 'test.log', filePath: path.join(temporaryRoot, 'test.log') }),
  invoke: async () => undefined,
});
export const shell = { openExternal: async () => {}, openPath: async () => '' };
export const dialog = { showOpenDialog: async () => ({ canceled: true, filePaths: [] }) };
export const getCurrentWindow = () => ({ close: () => {} });
export const cleanup = () => rmSync(temporaryRoot, { recursive: true, force: true });
