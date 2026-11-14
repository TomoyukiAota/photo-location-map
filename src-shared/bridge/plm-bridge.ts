import type { ExifReadResult } from '../exif/exif-read-result.js';
import type { IpcParams } from '../ipc/ipc-params.js';
import type { PhotoDataViewerIpcParams } from '../photo-data-viewer/photo-data-viewer-ipc-params.js';
import type { StartupMetadata } from '../startup/startup-metadata.js';

/** The tree of a folder that the user opens, which the main process made (src-main/directory-tree/), as plain data. */
export type DirectoryTreeResult =
  | {
    kind: 'ok';
    /** Each item has `fsStats` with the item's `mtime`; null when the folder is not there, as directory-tree returns. */
    tree: DirectoryTree | null;
    /** For each file with a Live Photos movie next to it, the movie's path, lowercased as the app has matched it. */
    livePhotos: Record<string, string>;
  }
  | { kind: 'failed'; message: string };

/** Where the thumbnail of one HEIF file is (src-main/thumbnail-generation/thumbnail-state.ts). */
export interface ThumbnailState {
  /** A thumbnail was attempted for the file as it is now: made, or failed. */
  attemptFinished: boolean;
  /** A thumbnail of the file as it is now is in the cache. */
  cacheAvailable: boolean;
  /** Where the thumbnail is, or will be. */
  thumbnailFilePath: string;
}

/** What `--open` asks the app to open after it launches, as the main process found it. */
export type OpenTarget =
  | { kind: 'none' }
  | { kind: 'file'; path: string; parentFolderPath: string }
  | { kind: 'directory'; path: string }
  | { kind: 'unexpected'; path: string }
  /** The path could not be read, such as one that is not there; `message` is the error's. */
  | { kind: 'failed'; path: string; message: string };

/** Stops a listener. */
export type Unsubscribe = () => void;
type Listener = () => void;
type AnalyticsListener = (category: string, action: string, label?: string, value?: string | number) => void;

/**
 * What the main window's preload (electron-util/preload/main-window.cjs) gives its page, as `window.plm`: the only
 * way the page, which has no Node.js and runs sandboxed with context isolation, reaches the main process. Each
 * member is one operation that the app needs; the main process checks that a request came from the main window's
 * page, and what it asks for (src-main/ipc/).
 */
export interface PlmBridge {
  readonly version: 1;
  /** Asked for once, synchronously, before the page's modules ran; null when the main process refused. */
  readonly startup: StartupMetadata | null;
  readonly storage: {
    /** The renderer's settings, read once (src-shared/user-data-storage/). */
    snapshot(): Record<string, string>;
    write(storagePath: ReadonlyArray<string>, value: string): Promise<void>;
  };
  readonly log: { append(message: string): void };
  readonly analytics: {
    sendToBackend(category: string, action: string, label?: string, value?: string | number): void;
    onAmplitudeEvent(listener: AnalyticsListener): Unsubscribe;
    onMixpanelEvent(listener: AnalyticsListener): Unsubscribe;
  };
  readonly folderDialog: {
    show(request: { defaultPath?: string }): Promise<{ canceled: boolean, filePaths: string[] }>;
    /** Whether the folder that the picker starts in is still a folder; false for any other path. */
    isDirectory(directoryPath: string): Promise<boolean>;
  };
  readonly exif: { read(filePath: string): Promise<ExifReadResult> };
  readonly directoryTree: { create(directoryPath: string): Promise<DirectoryTreeResult> };
  readonly thumbnails: {
    generate(allHeifFilePaths: string[], heifFilePathsToGenerate: string[]): Promise<void>;
    state(filePaths: string[]): Promise<ThumbnailState[]>;
  };
  readonly thumbnailCache: {
    open(): Promise<void>;
    /** Empties the cache, then restarts the app; the restart ends the page. */
    deleteAndRestart(): Promise<void>;
  };
  readonly shell: {
    /** Opens an http or https URL in the OS browser. */
    openExternal(url: string): Promise<void>;
    /** Opens a file or folder in an opened folder, with the OS. */
    openWithAssociatedApp(filePath: string): Promise<void>;
    openContainingFolder(filePath: string): Promise<void>;
  };
  readonly app: { restart(): void };
  readonly commandLine: { openTarget(): Promise<OpenTarget> };
  readonly menus: { updateUndoRedo(params: IpcParams.PhotoSelection.UpdateUndoRedoMenus): Promise<void> };
  readonly photoDataViewer: { open(params: PhotoDataViewerIpcParams): Promise<void> };
  readonly explorerContextMenu: { add(): Promise<void>; remove(): Promise<void> };
  readonly events: {
    onAboutBox(listener: Listener): Unsubscribe;
    onManageSettings(listener: Listener): Unsubscribe;
    onWelcomeDialog(listener: Listener): Unsubscribe;
    onUndo(listener: Listener): Unsubscribe;
    onRedo(listener: Listener): Unsubscribe;
    onRecordAtAppLaunchFinished(listener: Listener): Unsubscribe;
  };
}

declare global {
  interface Window {
    plm?: PlmBridge;
  }
}

/** The bridge, in a page that the main window's preload ran in; undefined elsewhere, as in the main process. */
export function plmBridge(): PlmBridge | undefined {
  return typeof window === 'undefined' ? undefined : window.plm;
}

/** What the preload dispatches on window once window.plm is there (electron-util/preload/main-window.cjs). */
export const bridgeReadyEvent = 'plm-bridge-ready';

/**
 * TL;DR: Resolves once the page has its bridge: at once, as the preload runs before the page's scripts, or when the
 * preload, run after them, says it is there. src/main.ts waits for it before it loads the app.
 * Details: Under Playwright's debugger, which pauses each new page at its start, Electron 45.2.1 ran the sandboxed
 * preload after the page's module in 6 of 16 launches of the e2e suite's profile: at 70 to 77 ms, after
 * DOMContentLoaded at 64 to 69 ms, against 3 to 10 ms, well before it, in the others. The app's modules read the
 * startup metadata while they are evaluated, so the page then failed with "process is not defined", as DevOrProd took
 * it for a page with Node.js. Launches without a debugger, 35 of them, and with Playwright's switches but no
 * debugger attached, ran the preload first every time. Waiting costs nothing when the preload is first.
 */
export function whenBridgeReady(): Promise<void> {
  if (plmBridge())
    return Promise.resolve();
  // This file is also built for the main process, without the DOM's types.
  const target = window as unknown as { addEventListener(type: string, listener: () => void, options: { once: boolean }): void };
  return new Promise(resolve => target.addEventListener(bridgeReadyEvent, () => resolve(), { once: true }));
}

/** The bridge, which the renderer's code cannot do without. */
export function bridge(): PlmBridge {
  const plm = plmBridge();
  if (!plm)
    throw new Error('This page has no bridge to the main process (electron-util/preload/main-window.cjs).');
  return plm;
}
