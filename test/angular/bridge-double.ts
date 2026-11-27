// The main window's preload, for unit tests of the renderer's code: window.plm, whose operations answer as the main
// process would when nothing is there, such as a canceled folder picker and files without thumbnails. The real bridge
// is tested by Electron-Mocha (test/electron-util/main-window-preload.spec.em.main.ts) and the Playwright suite.
import * as os from 'node:os';
import * as path from 'node:path';
import type { PlmBridge, Unsubscribe } from '../../src-shared/bridge/plm-bridge.js';

export function createBridgeDouble(temporaryRoot: string): PlmBridge {
  const listen = (): Unsubscribe => () => {};
  const thumbnailCacheDir = path.join(temporaryRoot, 'thumbnail-cache');
  return {
    version: 1,
    startup: {
      version: '0.0.0-test',
      userDataPath: path.join(temporaryRoot, 'userData'),
      platform: process.platform,
      systemLanguages: ['en-US'],
      pathSeparator: path.sep,
      homeDir: os.homedir(),
      userName: os.userInfo().username,
      devOrProd: 'Dev',
      isE2e: false,
      logFile: { dirName: temporaryRoot, fileName: 'test.log', filePath: path.join(temporaryRoot, 'test.log') },
      thumbnailCacheDir,
      hevcInPage: 'auto',
    },
    storage: { snapshot: () => ({}), write: async () => {} },
    log: { append: () => {} },
    analytics: { sendToBackend: () => {}, onAmplitudeEvent: listen, onMixpanelEvent: listen },
    folderDialog: { show: async () => ({ canceled: true, filePaths: [] }), isDirectory: async () => false },
    exif: { read: async () => ({ parse: 'empty' as const }) },
    // No photo's metadata marks a face.
    faceRegions: { have: async filePaths => filePaths.map(() => false) },
    directoryTree: { create: async () => ({ kind: 'failed', message: 'No folder can be read in a unit test.' }) },
    // The files exist nowhere: no thumbnail was attempted or is in the cache.
    thumbnails: {
      generate: async () => {},
      state: async filePaths => filePaths.map(filePath => ({
        attemptFinished: false, cacheAvailable: false, thumbnailFilePath: path.join(thumbnailCacheDir, `${path.basename(filePath)}.plm.jpg`),
      })),
      cancel: async () => {},
    },
    // The files exist nowhere: they have no image to read.
    heif: { embeddedThumbnail: async () => null, embeddedThumbnailJpeg: async () => null, wholeImage: async () => null },
    // The files exist nowhere: none can be read, and a thumbnail is kept where the cache would have it.
    jpegPngThumbnails: {
      readPhoto: async () => null,
      save: async filePath => path.join(thumbnailCacheDir, `${path.basename(filePath)}.plm.jpg`),
    },
    thumbnailCache: { size: async () => 0, open: async () => {}, deleteAndRestart: async () => {} },
    shell: { openExternal: async () => {}, openWithAssociatedApp: async () => {}, openContainingFolder: async () => {} },
    app: { restart: () => {} },
    commandLine: { openTarget: async () => ({ kind: 'none' }) },
    // As for a File that is not on the disk, which every File of a unit test is.
    droppedItem: { openTarget: async () => ({ kind: 'none' }), choose: async () => ({ kind: 'none' }) },
    menus: { updateUndoRedo: async () => {}, updateSelectPreviousNext: async () => {}, updateNarrowDownToPhotosWithFaces: async () => {} },
    mapFullScreen: { set: async () => {} },
    photoDataViewer: { open: async () => {} },
    explorerContextMenu: { add: async () => {}, remove: async () => {} },
    events: {
      onAboutBox: listen, onManageSettings: listen, onWelcomeDialog: listen,
      onUndo: listen, onRedo: listen, onSelectPrevious: listen, onSelectNext: listen, onNarrowDownToPhotosWithFaces: listen,
      onToggleMapFullScreen: listen, onWindowLeftFullScreen: listen,
      onRecordAtAppLaunchFinished: listen,
    },
  };
}
