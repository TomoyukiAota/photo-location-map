import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { afterAll, beforeEach } from 'vitest';
import { UserDataStorage } from '../../src-shared/user-data-storage/user-data-storage.js';
import { createBridgeDouble } from './bridge-double.js';
import type { UserDataStorage as UserDataStorageDouble } from './storage-double.js';

const temporaryRoot = mkdtempSync(path.join(tmpdir(), 'plm-vitest-'));

// The page's bridge to the main process, before the application's code is imported: modules read the startup
// metadata while they are evaluated. Each test gets a new one, so that a test's spies on it do not last.
window.plm = createBridgeDouble(temporaryRoot);

beforeEach(() => {
  window.plm = createBridgeDouble(temporaryRoot);
  // The application's UserDataStorage is ./storage-double here ("fileReplacements" in angular.json), built as the
  // module of the application's path. Imported as ./storage-double, it would be a second instance, which the
  // application never reads, so reset() would not isolate the tests.
  (UserDataStorage as unknown as typeof UserDataStorageDouble).reset();
});
afterAll(() => {
  rmSync(temporaryRoot, { recursive: true, force: true });
});
