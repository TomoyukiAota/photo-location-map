import assert from 'assert';
import { screen } from 'electron';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  boundsToOpen, centeredIn, defaultBoundsIn, defaultWindowSize, fitInto, PhotoDataViewerWindowState,
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
    // The main window on the display of `area`, the only one.
    const only = (area: Electron.Rectangle) => ({ main: area, all: [area] });
    // The main window on the primary display, which has another at its left.
    const withMacAtLeft = { main: fullHd, all: [fullHd, macAtLeft] };

    it('opens with the default bounds when nothing is saved', () => {
      assert.deepStrictEqual(boundsToOpen({}, only(fullHd)), defaultBoundsIn(fullHd));
    });

    it('opens with the default bounds for the old default, 500x500 at (100, 100), of a window never moved or resized', () => {
      assert.deepStrictEqual(boundsToOpen({ x: 100, y: 100, width: 500, height: 500 }, only(hd)), defaultBoundsIn(hd));
    });

    it('keeps the bounds that the user gave the window, where enough of its title bar is on a display', () => {
      for (const saved of [
        { x: 100, y: 100, width: 700, height: 500 },
        { x: 30, y: 40, width: 500, height: 640 },
        // Past the work area, with 100 pixels of its title bar's width in it.
        { x: 1820, y: 900, width: 2000, height: 1200 },
        // Half of its title bar's height in the work area, the other half behind Windows' taskbar.
        { x: 300, y: 1016, width: 700, height: 500 },
        // Maximized on Windows, past the work area by its frame.
        { x: -8, y: -8, width: 1936, height: 1048 },
      ]) assert.deepStrictEqual(boundsToOpen(saved, only(fullHd)), saved);
      // Across two displays.
      const across = { x: -600, y: 100, width: 1240, height: 800 };
      assert.deepStrictEqual(boundsToOpen(across, withMacAtLeft), across);
    });

    it('opens a window that would be out of sight with its size in the middle of the main window\'s display', () => {
      // On a display at the left that is no longer connected.
      assert.deepStrictEqual(boundsToOpen({ x: -1200, y: 100, width: 700, height: 640 }, only(fullHd)),
        { x: 610, y: 196, width: 700, height: 640 });
      // With too little of its title bar on the display: 99 pixels of its width, less than half of its height above
      // Windows' taskbar, or none of it, above the work area, where the rest of the window is in it.
      for (const saved of [
        { x: 1821, y: 100, width: 700, height: 640 },
        { x: 100, y: 1017, width: 700, height: 640 },
        { x: 100, y: -300, width: 700, height: 640 },
      ]) assert.deepStrictEqual(boundsToOpen(saved, only(fullHd)), { x: 610, y: 196, width: 700, height: 640 });
      // The main window on another display than the primary one.
      const mainOnMacAtLeft = { ...withMacAtLeft, main: macAtLeft };
      assert.deepStrictEqual(boundsToOpen({ x: 2500, y: 100, width: 700, height: 640 }, mainOnMacAtLeft),
        { x: -1070, y: 108, width: 700, height: 640 });
      // Larger than the main window's display.
      assert.deepStrictEqual(boundsToOpen({ x: 4000, y: 0, width: 1800, height: 1000 }, only(hd)),
        { x: 0, y: 0, width: 1366, height: 720 });
    });

    it('gives the default size to a window that was moved but never resized, where it was, in that display', () => {
      // At the right of the display of the main window: moved left, to stay in the work area.
      assert.deepStrictEqual(boundsToOpen({ x: 1300, y: 150, width: 500, height: 500 }, only(fullHd)),
        { x: 680, y: 150, width: 1240, height: 800 });
      // On another display, smaller than the default size.
      assert.deepStrictEqual(boundsToOpen({ x: -900, y: 300, width: 500, height: 500 }, withMacAtLeft),
        { x: -1240, y: 30, width: 1240, height: 800 });
      // Across two displays: in the one that has more of its title bar.
      assert.deepStrictEqual(boundsToOpen({ x: -300, y: 100, width: 500, height: 500 }, withMacAtLeft),
        { x: -1240, y: 30, width: 1240, height: 800 });
      assert.deepStrictEqual(boundsToOpen({ x: -200, y: 100, width: 500, height: 500 }, withMacAtLeft),
        { x: 0, y: 100, width: 1240, height: 800 });
      // On a display that is no longer connected: the default bounds.
      assert.deepStrictEqual(boundsToOpen({ x: -900, y: 300, width: 500, height: 500 }, only(fullHd)),
        defaultBoundsIn(fullHd));
    });

    it('takes a part of the bounds without the rest as nothing saved', () => {
      assert.deepStrictEqual(boundsToOpen({ x: 30, y: 40, width: 700 }, only(fullHd)), defaultBoundsIn(fullHd));
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
      // Partly past the left edge of the primary display.
      const { workArea } = screen.getPrimaryDisplay();
      const bounds = { x: workArea.x - 12, y: workArea.y + 15, width: 700, height: 640 };
      await save({ x: `${bounds.x}`, y: `${bounds.y}`, width: '700', height: '640' });
      assert.deepStrictEqual(PhotoDataViewerWindowState.get(), bounds);
    });

    it('opens a window saved where no display is now with its size in the middle of the main window\'s display', async () => {
      const right = Math.max(...screen.getAllDisplays().map(({ bounds }) => bounds.x + bounds.width));
      await save({ x: `${right + 1000}`, y: '40', width: '700', height: '640' });
      const display = screen.getAllDisplays().at(-1);
      assert.deepStrictEqual(PhotoDataViewerWindowState.get(display.bounds),
        centeredIn(display.workArea, { width: 700, height: 640 }));
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
