// The preload of the main window: the only way its page, which runs without Node.js in a sandbox with context
// isolation, reaches the main process. It gives the page window.plm, a set of narrow operations, each for one need of
// the app (src-shared/bridge/plm-bridge.ts); none sends on a channel that the page names, or exposes ipcRenderer,
// Node.js, the file system or a shell. The main process checks that each request came from the main window's page.
// TL;DR: Self-contained. A sandboxed preload can require 'electron' and a few of Node.js's modules, but no file.
// Details: The channels are copies of src-shared/ipc/ipc-constants.ts and of the analytics and log channels;
// test/electron-util/main-window-preload.spec.em.main.ts checks that they stay the same.
'use strict';
const { contextBridge, ipcRenderer } = require('electron');

const channels = {
  startupMetadata: 'ipc-constants-get-startup-metadata',
  storageSnapshot: 'ipc-constants-user-data-storage-snapshot',
  storageWrite: 'ipc-constants-user-data-storage-write',
  logAppend: 'log-file-writer-append',
  analyticsBackend: 'analytics-backend-track-event',
  amplitude: 'amplitude-analytics-browser-track-event',
  mixpanel: 'mixpanel-browser-track-event',
  folderDialogShow: 'ipc-constants-show-folder-dialog',
  folderDialogIsDirectory: 'ipc-constants-folder-dialog-is-directory',
  exifRead: 'ipc-constants-read-exif',
  directoryTreeCreate: 'ipc-constants-create-directory-tree',
  thumbnailsGenerate: 'ipc-constants-thumbnail-generation-in-main-process',
  thumbnailsState: 'ipc-constants-thumbnail-state',
  thumbnailCacheOpen: 'ipc-constants-open-thumbnail-cache',
  thumbnailCacheDeleteAndRestart: 'ipc-constants-delete-thumbnail-cache-and-restart',
  openExternal: 'ipc-constants-open-external-url',
  openWithAssociatedApp: 'ipc-constants-open-with-associated-app',
  openContainingFolder: 'ipc-constants-open-containing-folder',
  restart: 'ipc-constants-restart-app',
  openTarget: 'ipc-constants-get-open-target',
  updateUndoRedoMenus: 'ipc-constants-photo-selection-update-undo-redo-menus',
  photoDataViewer: 'ipc-constants-launch-photo-data-viewer',
  explorerContextMenuAdd: 'ipc-constants-explorer-context-menu-add',
  explorerContextMenuRemove: 'ipc-constants-explorer-context-menu-remove',
  aboutBox: 'ipc-constants-show-about-box',
  manageSettings: 'ipc-constants-manage-settings',
  welcomeDialog: 'ipc-constants-show-welcome-dialog',
  undo: 'ipc-constants-photo-selection-undo',
  redo: 'ipc-constants-photo-selection-redo',
  recordAtAppLaunchFinished: 'ipc-constants-record-at-app-launch-finished',
};

// TL;DR: The messages that the main process sends to the page, listened to from the preload's start. What comes
// before the page listens on a channel goes to its first listener.
// Details: The page loads the app's modules once it has its bridge (src/main.ts), so they can start listening after
// the main process has sent, as it sends the end of the launch's records, which opens the folder of --open, and the
// analytics events of the launch, once the window is ready to show. A channel keeps at most maxPending messages.
const eventChannels = [channels.amplitude, channels.mixpanel, channels.aboutBox, channels.manageSettings,
  channels.welcomeDialog, channels.undo, channels.redo, channels.recordAtAppLaunchFinished];
const maxPending = 1000;
const hubs = new Map();
for (const channel of eventChannels) {
  const hub = { listeners: new Set(), pending: [] };
  hubs.set(channel, hub);
  ipcRenderer.on(channel, (_event, ...args) => {
    if (hub.pending) {
      if (hub.pending.length < maxPending) hub.pending.push(args);
      return;
    }
    for (const listener of [...hub.listeners]) listener(...args);
  });
}

/** Calls `listener` with the arguments of each message on `channel`, without the IPC event; returns how to stop. */
function subscribe(channel, listener) {
  if (typeof listener !== 'function') throw new TypeError('A listener must be a function.');
  const hub = hubs.get(channel);
  const subscription = (...args) => listener(...args);
  hub.listeners.add(subscription);
  const pending = hub.pending;
  hub.pending = null;
  // After subscribe returns, as a message would come.
  if (pending && pending.length > 0) Promise.resolve().then(() => pending.forEach(args => subscription(...args)));
  return () => { hub.listeners.delete(subscription); };
}

const plm = {
  version: 1,
  // Read while the page's modules are evaluated, before Angular starts, so asked for synchronously, once, here.
  startup: ipcRenderer.sendSync(channels.startupMetadata),
  storage: {
    snapshot: () => ipcRenderer.sendSync(channels.storageSnapshot),
    write: (storagePath, value) => ipcRenderer.invoke(channels.storageWrite, storagePath, value),
  },
  log: { append: message => { ipcRenderer.send(channels.logAppend, String(message)); } },
  analytics: {
    sendToBackend: (category, action, label, value) => { ipcRenderer.send(channels.analyticsBackend, category, action, label, value); },
    onAmplitudeEvent: listener => subscribe(channels.amplitude, listener),
    onMixpanelEvent: listener => subscribe(channels.mixpanel, listener),
  },
  folderDialog: {
    show: request => ipcRenderer.invoke(channels.folderDialogShow, request),
    isDirectory: directoryPath => ipcRenderer.invoke(channels.folderDialogIsDirectory, directoryPath),
  },
  exif: { read: filePath => ipcRenderer.invoke(channels.exifRead, filePath) },
  directoryTree: { create: directoryPath => ipcRenderer.invoke(channels.directoryTreeCreate, directoryPath) },
  thumbnails: {
    generate: (allHeifFilePaths, heifFilePathsToGenerate) => ipcRenderer.invoke(channels.thumbnailsGenerate, allHeifFilePaths, heifFilePathsToGenerate),
    state: filePaths => ipcRenderer.invoke(channels.thumbnailsState, filePaths),
  },
  thumbnailCache: {
    open: () => ipcRenderer.invoke(channels.thumbnailCacheOpen),
    deleteAndRestart: () => ipcRenderer.invoke(channels.thumbnailCacheDeleteAndRestart),
  },
  shell: {
    openExternal: url => ipcRenderer.invoke(channels.openExternal, url),
    openWithAssociatedApp: filePath => ipcRenderer.invoke(channels.openWithAssociatedApp, filePath),
    openContainingFolder: filePath => ipcRenderer.invoke(channels.openContainingFolder, filePath),
  },
  app: { restart: () => { ipcRenderer.send(channels.restart); } },
  commandLine: { openTarget: () => ipcRenderer.invoke(channels.openTarget) },
  menus: { updateUndoRedo: params => ipcRenderer.invoke(channels.updateUndoRedoMenus, params) },
  photoDataViewer: { open: params => ipcRenderer.invoke(channels.photoDataViewer, params) },
  explorerContextMenu: {
    add: () => ipcRenderer.invoke(channels.explorerContextMenuAdd),
    remove: () => ipcRenderer.invoke(channels.explorerContextMenuRemove),
  },
  events: {
    onAboutBox: listener => subscribe(channels.aboutBox, listener),
    onManageSettings: listener => subscribe(channels.manageSettings, listener),
    onWelcomeDialog: listener => subscribe(channels.welcomeDialog, listener),
    onUndo: listener => subscribe(channels.undo, listener),
    onRedo: listener => subscribe(channels.redo, listener),
    onRecordAtAppLaunchFinished: listener => subscribe(channels.recordAtAppLaunchFinished, listener),
  },
};

// With context isolation, as in the app, the page gets a frozen copy through contextBridge. Without it, as in
// electron-mocha's renderer tests (electron-util/electron-web-preferences.js), the preload and the page share a world.
if (process.contextIsolated) contextBridge.exposeInMainWorld('plm', plm);
else /** @type {Window & { plm?: unknown }} */ (window).plm = plm;
// For a page whose scripts ran before this preload, which waits for its bridge (src-shared/bridge/plm-bridge.ts).
window.dispatchEvent(new Event('plm-bridge-ready'));
