import assert from 'assert';
import { showFolderDialog } from '../../../src-main/folder-dialog/show-folder-dialog.js';

describe('showFolderDialog', () => {
  const sender = { id: 1 } as unknown as Electron.WebContents;
  const window = { id: 'window of the sender' };

  function standIn(result: { canceled: boolean, filePaths: string[], bookmarks?: string[] }) {
    const calls: unknown[][] = [];
    return {
      calls,
      electron: {
        BrowserWindow: { fromWebContents: (contents: unknown) => (contents === sender ? window : null) },
        dialog: { showOpenDialog: async (...args: unknown[]) => { calls.push(args); return result; } },
      } as never,
    };
  }

  it('shows the picker for folders, modal to the window that asked, starting in the remembered folder', async () => {
    const { calls, electron } = standIn({ canceled: false, filePaths: ['/photos'] });
    const result = await showFolderDialog(sender, { defaultPath: '/remembered' }, electron);
    assert.deepStrictEqual(calls, [[window, { properties: ['openDirectory'], defaultPath: '/remembered' }]]);
    assert.deepStrictEqual(result, { canceled: false, filePaths: ['/photos'] });
  });

  it('starts nowhere in particular without a remembered folder, and ignores anything but a string', async () => {
    for (const request of [undefined, {}, { defaultPath: 42 }, 'not an object']) {
      const { calls, electron } = standIn({ canceled: true, filePaths: [] });
      await showFolderDialog(sender, request, electron);
      assert.deepStrictEqual(calls, [[window, { properties: ['openDirectory'], defaultPath: undefined }]]);
    }
  });

  it('gives back only whether it was canceled and the chosen folders', async () => {
    const { electron } = standIn({ canceled: false, filePaths: ['/photos'], bookmarks: ['secret'] });
    assert.deepStrictEqual(await showFolderDialog(sender, {}, electron), { canceled: false, filePaths: ['/photos'] });
  });

  it('refuses a request that no window made', async () => {
    const { calls, electron } = standIn({ canceled: true, filePaths: [] });
    await assert.rejects(showFolderDialog({ id: 2 } as unknown as Electron.WebContents, {}, electron), /window/);
    assert.deepStrictEqual(calls, []);
  });
});
