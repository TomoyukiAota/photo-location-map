import { afterAll, beforeEach, vi } from 'vitest';
import { UserDataStorage } from '../../src-shared/user-data-storage/user-data-storage';
import { cleanup, ipcRenderer, temporaryRoot } from './electron-double';
import type { UserDataStorage as UserDataStorageDouble } from './storage-double';

vi.mock('electron', () => import('./electron-double'));
vi.mock('@electron/remote', () => import('./electron-double'));

// Cache paths also derive directly from the environment, outside the remote
// app-path and storage boundaries. Set this before importing application code.
vi.stubEnv('PLM_TEST_ROOT', temporaryRoot);

beforeEach(() => {
  // The application's UserDataStorage is ./storage-double here ("fileReplacements" in angular.json), built as the
  // module of the application's path. Imported as ./storage-double, it would be a second instance, which the
  // application never reads, so reset() would not isolate the tests.
  (UserDataStorage as unknown as typeof UserDataStorageDouble).reset();
  ipcRenderer.removeAllListeners();
});
afterAll(() => {
  cleanup();
  vi.unstubAllEnvs();
});
