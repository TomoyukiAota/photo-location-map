import assert = require('assert');
import type { IpcMainInvokeEvent, WebContents } from 'electron';
import {
  addPhotoDataViewerWindow, assertFromMainWindow, isFromMainWindow, isFromPhotoDataViewerWindow, setMainWindow
} from '../../../src-main/ipc/ipc-sender';

// Stand-ins for a window's web contents and the IPC events from its frames.
function contents() {
  const handlers = new Map<string, () => void>();
  let destroyed = false;
  return {
    isDestroyed: () => destroyed,
    once: (name: string, handler: () => void) => { handlers.set(name, handler); },
    destroy: () => { destroyed = true; handlers.get('destroyed')?.(); },
  };
}
type Contents = ReturnType<typeof contents>;
const topFrame = (url: string) => ({ url, parent: null });
const childFrame = (url: string) => ({ url, parent: topFrame(url) });
const from = (sender: Contents, senderFrame: unknown) => ({ sender, senderFrame } as unknown as IpcMainInvokeEvent);
const asWebContents = (standIn: Contents) => standIn as unknown as WebContents;

describe('ipc-sender (in main process)', () => {
  afterEach(() => setMainWindow(undefined));

  it('takes the top frame of the main window on the app\'s file, wherever its route is', () => {
    const main = contents();
    setMainWindow(asWebContents(main), 'file:///app/dist/index.html');
    assert.strictEqual(isFromMainWindow(from(main, topFrame('file:///app/dist/index.html'))), true);
    assert.strictEqual(isFromMainWindow(from(main, topFrame('file:///app/dist/index.html#/settings'))), true);
  });

  it('refuses another page in the main window, a frame within the page, and another window', () => {
    const main = contents();
    setMainWindow(asWebContents(main), 'file:///app/dist/index.html');
    assert.strictEqual(isFromMainWindow(from(main, topFrame('file:///app/docs/index.html'))), false);
    assert.strictEqual(isFromMainWindow(from(main, topFrame('https://example.com/'))), false);
    assert.strictEqual(isFromMainWindow(from(main, childFrame('file:///app/dist/index.html'))), false);
    assert.strictEqual(isFromMainWindow(from(main, null)), false);
    assert.strictEqual(isFromMainWindow(from(contents(), topFrame('file:///app/dist/index.html'))), false);
    main.destroy();
    assert.strictEqual(isFromMainWindow(from(main, topFrame('file:///app/dist/index.html'))), false);
  });

  it('takes the app\'s file however its path is escaped, as Node.js and Chromium escape some characters differently', () => {
    const main = contents();
    setMainWindow(asWebContents(main), 'file:///Users/a%20b/%E5%86%99%E7%9C%9F/app/dist/index.html');
    assert.strictEqual(isFromMainWindow(from(main, topFrame('file:///Users/a%20b/写真/app/dist/index.html#/'))), true);
    setMainWindow(asWebContents(main), 'file:///C:/Program%20Files/app%5E1/dist/index.html');
    assert.strictEqual(isFromMainWindow(from(main, topFrame('file:///C:/Program%20Files/app^1/dist/index.html'))), true);
    assert.strictEqual(isFromMainWindow(from(main, topFrame('file:///C:/Program%20Files/app%5E2/dist/index.html'))), false);
    assert.strictEqual(isFromMainWindow(from(main, topFrame('file:///c:/program%20files/app%5E1/dist/index.html'))), process.platform === 'win32');
  });

  it('takes the origin of ng serve for live reload, and no other origin', () => {
    const main = contents();
    setMainWindow(asWebContents(main), 'http://localhost:4200');
    assert.strictEqual(isFromMainWindow(from(main, topFrame('http://localhost:4200/#/'))), true);
    assert.strictEqual(isFromMainWindow(from(main, topFrame('http://localhost:4201/'))), false);
    assert.strictEqual(isFromMainWindow(from(main, topFrame('https://localhost:4200/'))), false);
  });

  it('takes any page of the window when no page is given, as for electron-mocha\'s renderer tests', () => {
    const main = contents();
    setMainWindow(asWebContents(main));
    assert.strictEqual(isFromMainWindow(from(main, topFrame('file:///anything/index.html'))), true);
  });

  it('refuses everything before the main window is set', () => {
    assert.strictEqual(isFromMainWindow(from(contents(), topFrame('file:///app/dist/index.html'))), false);
    assert.throws(() => assertFromMainWindow(from(contents(), null), 'Reading EXIF'),
      new Error('Reading EXIF is only for the main window.'));
  });

  it('tells Photo Data Viewer\'s windows apart, until they are destroyed', () => {
    const main = contents();
    const viewer = contents();
    setMainWindow(asWebContents(main), 'file:///app/dist/index.html');
    addPhotoDataViewerWindow(asWebContents(viewer));
    const fromViewer = from(viewer, topFrame('https://photo-data-viewer.example/'));
    assert.strictEqual(isFromPhotoDataViewerWindow(fromViewer), true);
    assert.strictEqual(isFromMainWindow(fromViewer), false);
    assert.strictEqual(isFromPhotoDataViewerWindow(from(viewer, childFrame('https://other.example/'))), false);
    assert.strictEqual(isFromPhotoDataViewerWindow(from(main, topFrame('file:///app/dist/index.html'))), false);
    viewer.destroy();
    assert.strictEqual(isFromPhotoDataViewerWindow(fromViewer), false);
  });
});
