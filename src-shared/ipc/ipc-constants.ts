export namespace IpcConstants {
  /** What `--open` asks the app to open after it launches, checked by the main process (src-main/command-line-options/). */
  export namespace CommandLineOptions {
    export const OpenTarget = 'ipc-constants-get-open-target';
  }

  export namespace RecordAtAppLaunch {
    export const Finished = 'ipc-constants-record-at-app-launch-finished';
  }

  export namespace AboutBox {
    export const Name = 'ipc-constants-show-about-box';
  }

  export namespace ManageSettings {
    export const Name = 'ipc-constants-manage-settings';
  }

  export namespace WelcomeDialog {
    export const Name = 'ipc-constants-show-welcome-dialog';
  }

  export namespace ThumbnailGenerationInMainProcess {
    export const Name = 'ipc-constants-thumbnail-generation-in-main-process';
  }

  export namespace PhotoDataViewer {
    export const Name = 'ipc-constants-launch-photo-data-viewer';
    /** Photo Data Viewer's page asks its window's photo (electron-util/preload/photo-data-viewer.cjs). */
    export const Photo = 'ipc-constants-photo-data-viewer-photo';
  }

  export namespace PhotoSelection {
    export const Undo = 'ipc-constants-photo-selection-undo';
    export const Redo = 'ipc-constants-photo-selection-redo';
    export const UpdateUndoRedoMenus = 'ipc-constants-photo-selection-update-undo-redo-menus';
  }

  export namespace ExplorerContextMenu {
    export const Add = 'ipc-constants-explorer-context-menu-add';
    export const Remove = 'ipc-constants-explorer-context-menu-remove';
  }

  /** The renderer's synchronous request for what it needs to know about the app (src-shared/startup/). */
  export namespace StartupMetadata {
    export const Get = 'ipc-constants-get-startup-metadata';
  }

  /** The folder picker for Open Folder, shown by the main process for the window that asks. */
  export namespace FolderDialog {
    export const Show = 'ipc-constants-show-folder-dialog';
    /** Whether the folder that the picker would start in is still a folder (open-folder-dialog-history.ts). */
    export const IsDirectory = 'ipc-constants-folder-dialog-is-directory';
  }

  /** The tree of a folder that the user opens, made off the main thread by the main process (src-main/directory-tree/). */
  export namespace DirectoryTree {
    export const Create = 'ipc-constants-create-directory-tree';
  }

  /** The cache of HEIF thumbnails (src-main/thumbnail-generation/). */
  export namespace ThumbnailCache {
    /** Whether each file's thumbnail was attempted and is in the cache, and where it is. */
    export const State = 'ipc-constants-thumbnail-state';
    export const Open = 'ipc-constants-open-thumbnail-cache';
    export const DeleteAndRestart = 'ipc-constants-delete-thumbnail-cache-and-restart';
  }

  /** Opening a web page in the OS browser, and a file or folder with the OS (src-main/shell/). */
  export namespace Shell {
    export const OpenExternal = 'ipc-constants-open-external-url';
    export const OpenWithAssociatedApp = 'ipc-constants-open-with-associated-app';
    export const OpenContainingFolder = 'ipc-constants-open-containing-folder';
  }

  /** A line of a renderer's log, which the main process writes to the log file (src-main/log/). */
  export namespace Log {
    export const Append = 'log-file-writer-append';
  }

  /** EXIF and the embedded thumbnail of one photo, read in the main process (src-main/exif/). */
  export namespace Exif {
    export const Read = 'ipc-constants-read-exif';
  }

  /** The settings: a renderer's synchronous request for its copy, and its writes (src-shared/user-data-storage/). */
  export namespace UserDataStorage {
    export const Snapshot = 'ipc-constants-user-data-storage-snapshot';
    export const Write = 'ipc-constants-user-data-storage-write';
  }

  /** A restart of the app, for a change that takes effect only on launch. Sent without waiting for an answer. */
  export namespace AppRestart {
    export const Request = 'ipc-constants-restart-app';
  }
}
