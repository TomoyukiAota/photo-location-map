import assert from 'assert';
import { screen } from 'electron';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  boundsToOpen, defaultBoundsIn, defaultWindowSize, fitInto, PhotoDataViewerWindowState,
} from '../../../src-main/photo-data-viewer/photo-data-viewer-window-state.js';
import { FileUserDataStorage } from '../../../src-main/user-data-storage/file-user-data-storage.js';
import { UserDataStorage } from '../../../src-shared/user-data-storage/user-data-storage.js';
import { UserDataStoragePath } from '../../../src-shared/user-data-storage/user-data-stroage-path.js';

describe('the bounds of Photo Data Viewer\'s window (in main process)', () => {
  // The work areas of a few displays: 1920x1080 at 100% and 1366x768, less Windows 11's taskbar of 48 pixels; 1920x1080
  // at 175%, which is 1097x617 less the taskbar; a Mac's 1440x900 at the left of the primary display, less its menu bar
  // and its Dock.
  const fullHd = { x: 0, y: 0, width: 1920, height: 1032 };
  const hd = { x: 0, y: 0, width: 1366, height: 720 };
  const fullHdAt175 = { x: 0, y: 0, width: 1097, height: 569 };
  const macAtLeft = { x: -1440, y: 25, width: 1440, height: 805 };
  const noDisplayAsked = (): Electron.Rectangle => { throw new Error('No display was to be looked for.'); };

  it('is wide enough by default for the viewer to split its panes, with Windows\' frame and a scroll bar', () => {
    // The viewer splits them in a page wider than 1200 pixels (photo-data-viewer-window-state.ts).
    assert.ok(defaultWindowSize.width - 16 - 17 > 1200);
  });

  describe('defaultBoundsIn', () => {
    it('puts the default size in the middle of a work area that has room for it', () => {
      assert.deepStrictEqual(defaultBoundsIn(fullHd), { x: 340, y: 116, width: 1240, height: 800 });
    });

    it('makes the default size smaller where the work area is, to the whole area', () => {
      assert.deepStrictEqual(defaultBoundsIn(hd), { x: 63, y: 0, width: 1240, height: 720 });
      assert.deepStrictEqual(defaultBoundsIn(fullHdAt175), { x: 0, y: 0, width: 1097, height: 569 });
    });

    it('keeps to a display that is not at the origin', () => {
      assert.deepStrictEqual(defaultBoundsIn(macAtLeft), { x: -1340, y: 28, width: 1240, height: 800 });
    });
  });

  describe('fitInto', () => {
    it('leaves bounds inside the area as they are', () => {
      assert.deepStrictEqual(fitInto({ x: 100, y: 100, width: 1240, height: 800 }, fullHd),
        { x: 100, y: 100, width: 1240, height: 800 });
    });

    it('moves bounds that go past the area into it, without changing their size', () => {
      assert.deepStrictEqual(fitInto({ x: 1500, y: 600, width: 1240, height: 800 }, fullHd),
        { x: 680, y: 232, width: 1240, height: 800 });
      assert.deepStrictEqual(fitInto({ x: -1600, y: 0, width: 1240, height: 800 }, macAtLeft),
        { x: -1440, y: 25, width: 1240, height: 800 });
    });

    it('makes bounds larger than the area as large as the area', () => {
      assert.deepStrictEqual(fitInto({ x: 300, y: 200, width: 1240, height: 800 }, fullHdAt175),
        { x: 0, y: 0, width: 1097, height: 569 });
    });
  });

  describe('boundsToOpen', () => {
    it('opens with the default bounds when nothing is saved', () => {
      assert.deepStrictEqual(boundsToOpen({}, fullHd, noDisplayAsked), defaultBoundsIn(fullHd));
    });

    it('opens with the default bounds for the old default, 500x500 at (100, 100), of a window never moved or resized', () => {
      assert.deepStrictEqual(boundsToOpen({ x: 100, y: 100, width: 500, height: 500 }, hd, noDisplayAsked),
        defaultBoundsIn(hd));
    });

    it('keeps the bounds that the user gave the window, past the work area too', () => {
      for (const saved of [
        { x: 100, y: 100, width: 700, height: 500 },
        { x: 30, y: 40, width: 500, height: 640 },
        { x: 1800, y: 900, width: 2000, height: 1200 },
      ]) assert.deepStrictEqual(boundsToOpen(saved, fullHd, noDisplayAsked), saved);
    });

    it('gives the default size to a window that was moved but never resized, where it was, in that display', () => {
      // At the right of the display of the main window: moved left, to stay in the work area.
      assert.deepStrictEqual(boundsToOpen({ x: 1300, y: 150, width: 500, height: 500 }, fullHd, () => fullHd),
        { x: 680, y: 150, width: 1240, height: 800 });
      // On another display, smaller than the default size.
      const displaysAsked: Electron.Rectangle[] = [];
      const workAreaOf = (bounds: Electron.Rectangle) => { displaysAsked.push(bounds); return macAtLeft; };
      assert.deepStrictEqual(boundsToOpen({ x: -900, y: 300, width: 500, height: 500 }, fullHd, workAreaOf),
        { x: -1240, y: 30, width: 1240, height: 800 });
      // The display where the window was, of its saved bounds rather than of its new size.
      assert.deepStrictEqual(displaysAsked, [{ x: -900, y: 300, width: 500, height: 500 }]);
    });

    it('takes a part of the bounds without the rest as nothing saved', () => {
      assert.deepStrictEqual(boundsToOpen({ x: 30, y: 40, width: 700 }, fullHd, noDisplayAsked), defaultBoundsIn(fullHd));
    });
  });

  describe('PhotoDataViewerWindowState.get', () => {
    let directory: string;
    let files: FileUserDataStorage;
    // The test's settings are in a temporary folder.
    beforeEach(() => {
      directory = fs.mkdtempSync(path.join(os.tmpdir(), 'plm-viewer-window-state-'));
      files = new FileUserDataStorage({ getPath: () => directory } as unknown as Electron.App);
      UserDataStorage.useBackend(files);
    });
    afterEach(async () => {
      const { app } = await import('electron');
      UserDataStorage.useBackend(new FileUserDataStorage(app)); // As src-main/user-data-storage/user-data-storage-setup.ts does.
      fs.rmSync(directory, { recursive: true, force: true });
    });

    async function save(bounds: Record<'x' | 'y' | 'width' | 'height', string>) {
      await files.write(UserDataStoragePath.PhotoDataViewer.WindowX, bounds.x);
      await files.write(UserDataStoragePath.PhotoDataViewer.WindowY, bounds.y);
      await files.write(UserDataStoragePath.PhotoDataViewer.WindowWidth, bounds.width);
      await files.write(UserDataStoragePath.PhotoDataViewer.WindowHeight, bounds.height);
    }

    it('opens with the bounds that the user gave the window', async () => {
      await save({ x: '-12', y: '40', width: '700', height: '640' });
      assert.deepStrictEqual(PhotoDataViewerWindowState.get(), { x: -12, y: 40, width: 700, height: 640 });
    });

    it('opens by default in the middle of the main window\'s display, or of the primary display without it', async () => {
      // The last display, which is another than the primary one where the computer has several.
      const display = screen.getAllDisplays().at(-1);
      assert.deepStrictEqual(PhotoDataViewerWindowState.get(display.bounds), defaultBoundsIn(display.workArea));
      assert.deepStrictEqual(PhotoDataViewerWindowState.get(), defaultBoundsIn(screen.getPrimaryDisplay().workArea));
      await save({ x: '100', y: '100', width: '500', height: '500' });
      assert.deepStrictEqual(PhotoDataViewerWindowState.get(display.bounds), defaultBoundsIn(display.workArea));
    });

    it('takes a saved value that is not a number as nothing saved', async () => {
      await save({ x: 'Fail to read', y: '40', width: '700', height: '640' });
      const primary = screen.getPrimaryDisplay();
      assert.deepStrictEqual(PhotoDataViewerWindowState.get(primary.bounds), defaultBoundsIn(primary.workArea));
    });
  });
});
