import { afterAll, beforeEach, vi } from 'vitest';
import { cleanup, ipcRenderer, temporaryRoot } from './electron-double';
import { UserDataStorage } from './storage-double';

vi.mock('electron', () => import('./electron-double'));
vi.mock('@electron/remote', () => import('./electron-double'));

// Cache paths also derive directly from the environment, outside the remote
// app-path and storage boundaries. Set this before importing application code.
vi.stubEnv('PLM_TEST_ROOT', temporaryRoot);

beforeEach(() => {
  UserDataStorage.reset();
  ipcRenderer.removeAllListeners();
});
afterAll(() => {
  cleanup();
  vi.unstubAllEnvs();
});
