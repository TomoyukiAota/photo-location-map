import assert from 'assert';
import { ipcRenderer } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { RendererUserDataStorage } from '../../../src-shared/user-data-storage/renderer-user-data-storage.js';
import { UserDataStoragePath } from '../../../src-shared/user-data-storage/user-data-stroage-path.js';

// Against the main process's real handlers and files (test/em-renderer-main-setup.ts).
describe('RendererUserDataStorage (in real Electron renderer)', () => {
  const userDataPath: string = ipcRenderer.sendSync('ipc-constants-get-startup-metadata').userDataPath;
  const fileOf = (storagePath: ReadonlyArray<string>) =>
    path.join(userDataPath, 'PhotoLocationMapStorage', ...storagePath.slice(0, -1), `${storagePath[storagePath.length - 1]}.json`);

  it('reads its copy at once after a write, and the main process writes the file in the order of the writes', async () => {
    const storage = new RendererUserDataStorage();
    const writes = ['Esri World Street Map', 'Esri World Imagery', 'OpenStreetMap']
      .map(value => storage.write(UserDataStoragePath.LeafletMap.SelectedBaseLayer, value));
    assert.strictEqual(storage.read(UserDataStoragePath.LeafletMap.SelectedBaseLayer), 'OpenStreetMap');
    await Promise.all(writes);
    assert.deepStrictEqual(JSON.parse(fs.readFileSync(fileOf(UserDataStoragePath.LeafletMap.SelectedBaseLayer), 'utf8')),
      { SelectedBaseLayer: 'OpenStreetMap' });
  });

  it('starts from what the main process saved, with the user ID that it made', async () => {
    await new RendererUserDataStorage().write(UserDataStoragePath.DirectoryTreeView.SortKey, 'name');
    const storage = new RendererUserDataStorage();
    assert.strictEqual(storage.read(UserDataStoragePath.DirectoryTreeView.SortKey), 'name');
    assert.match(storage.read(UserDataStoragePath.Analytics.UserId), /^[0-9a-f-]{36}$/);
    assert.throws(() => storage.read(UserDataStoragePath.FolderDialog.LastConfirmedDirectory), /No value/);
  });

  it('rejects a write of a setting that the main process owns, and leaves its file alone', async () => {
    const storage = new RendererUserDataStorage();
    await assert.rejects(storage.write(UserDataStoragePath.History.LaunchCount, '999'), /cannot write/);
    assert.ok(!fs.existsSync(fileOf(UserDataStoragePath.History.LaunchCount)) ||
      JSON.parse(fs.readFileSync(fileOf(UserDataStoragePath.History.LaunchCount), 'utf8')).LaunchCount !== '999');
  });
});
