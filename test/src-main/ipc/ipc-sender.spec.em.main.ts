import assert from 'assert';
import type { IpcMainInvokeEvent, WebContents } from 'electron';
import {
  addPhotoDataViewerWindow, assertFromMainWindow, isFromMainWindow, isFromPhotoDataViewerWindow, setMainWindow
} from '../../../src-main/ipc/ipc-sender.js';

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

  it('takes the top frame of the main window, whatever its URL, as the window stays on the app\'s page', () => {
    const main = contents();
    setMainWindow(asWebContents(main));
    // The frame's URL can still be the previous one when the preload asks at the document's start.
    for (const url of ['file:///app/dist/index.html#/', 'about:blank', ''])
      assert.strictEqual(isFromMainWindow(from(main, topFrame(url))), true, url);
  });

  it('refuses a frame within the page, another window, a destroyed window and a request without a frame', () => {
    const main = contents();
    setMainWindow(asWebContents(main));
    assert.strictEqual(isFromMainWindow(from(main, childFrame('file:///app/dist/index.html'))), false);
    assert.strictEqual(isFromMainWindow(from(main, null)), false);
    assert.strictEqual(isFromMainWindow(from(contents(), topFrame('file:///app/dist/index.html'))), false);
    main.destroy();
    assert.strictEqual(isFromMainWindow(from(main, topFrame('file:///app/dist/index.html'))), false);
  });

  it('refuses everything before the main window is set', () => {
    assert.strictEqual(isFromMainWindow(from(contents(), topFrame('file:///app/dist/index.html'))), false);
    assert.throws(() => assertFromMainWindow(from(contents(), null), 'Reading EXIF'),
      new Error('Reading EXIF is only for the main window.'));
  });

  it('tells Photo Data Viewer\'s windows apart, until they are destroyed', () => {
    const main = contents();
    const viewer = contents();
    setMainWindow(asWebContents(main));
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
