// The preload of Photo Data Viewer's window: the only way its page, which runs without Node.js in a sandbox with
// context isolation, reaches the main process. It gives the page window.plmPhotoDataViewer
// (src-shared/photo-data-viewer/photo-data-viewer-bridge.ts): the photo that the user chose, and the analytics of
// this app; the main process gives them only to a window of the viewer (src-main/photo-data-viewer/).
// TL;DR: Self-contained, as a sandboxed preload can require 'electron' and a few of Node.js's modules, but no file.
// Details: The channels are copies of src-shared/ipc/ipc-constants.ts and of the analytics channel, which the
// viewer's legacy path also sends on; test/electron-util/photo-data-viewer-preload.spec.em.main.ts checks them.
'use strict';
const { contextBridge, ipcRenderer } = require('electron');

const channels = {
  photo: 'ipc-constants-photo-data-viewer-photo',
  analyticsBackend: 'analytics-backend-track-event',
};

const viewer = {
  version: 1,
  readPhoto: () => ipcRenderer.invoke(channels.photo),
  trackEvent: (category, action, label, value) => {
    ipcRenderer.send(channels.analyticsBackend, category, action, label, value);
  },
};

contextBridge.exposeInMainWorld('plmPhotoDataViewer', viewer);
// For a page whose scripts ran before this preload, as they can under a debugger (src-shared/bridge/plm-bridge.ts).
window.dispatchEvent(new Event('plm-photo-data-viewer-bridge-ready'));
