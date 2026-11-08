import assert = require('assert');
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { FileUserDataStorage } from '../../../src-main/user-data-storage/file-user-data-storage';
import { rendererStorageSnapshot, writeFromRenderer } from '../../../src-main/user-data-storage/renderer-storage-requests';
import { UserDataStoragePath } from '../../../src-shared/user-data-storage/user-data-stroage-path';

describe('the renderer\'s requests for settings (in main process)', () => {
  let directory: string;
  let files: FileUserDataStorage;
  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'plm-renderer-storage-'));
    files = new FileUserDataStorage({ getPath: () => directory } as unknown as Electron.App);
  });
  afterEach(() => fs.rmSync(directory, { recursive: true, force: true }));

  it('gives the renderer its own settings and the user ID, and none of the main process\'s', async () => {
    await files.write(UserDataStoragePath.LeafletMap.SelectedBaseLayer, 'Esri World Topo Map');
    await files.write(UserDataStoragePath.History.LaunchCount, '7');
    await files.write(UserDataStoragePath.PhotoDataViewer.WindowX, '40');
    await files.write(UserDataStoragePath.Analytics.UserId, 'user-id');
    assert.deepStrictEqual(rendererStorageSnapshot(files), {
      'LeafletMap/SelectedBaseLayer': 'Esri World Topo Map',
      'Analytics/UserId': 'user-id',
    });
  });

  it('writes a setting that the renderer saved, as a file of the settings', async () => {
    await writeFromRenderer(UserDataStoragePath.UserSettings.DateFormat, 'DD/MM/YYYY');
    await writeFromRenderer(['UserSettings', 'DateFormat'], 'MM/DD/YYYY');
    // The registered storage is the test profile's files (test/em-main.mocharc.js).
    const { app } = await import('electron');
    const file = path.join(app.getPath('userData'), 'PhotoLocationMapStorage', 'UserSettings', 'DateFormat.json');
    assert.deepStrictEqual(JSON.parse(fs.readFileSync(file, 'utf8')), { DateFormat: 'MM/DD/YYYY' });
  });

  it('refuses the main process\'s own settings, other paths and values that are not strings', () => {
    for (const storagePath of [UserDataStoragePath.Analytics.UserId, UserDataStoragePath.History.LaunchCount,
      UserDataStoragePath.PhotoDataViewer.WindowWidth, ['..', 'UserSettings', 'DateFormat'], 'UserSettings/DateFormat', [1, 2]]) {
      assert.throws(() => writeFromRenderer(storagePath, 'x'), /cannot write/);
    }
    assert.throws(() => writeFromRenderer(UserDataStoragePath.UserSettings.DateFormat, 42), /cannot write/);
  });
});
