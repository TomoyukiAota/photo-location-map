export namespace IpcConstants {
  export namespace CommandLineOptions {
    export const Get = 'ipc-constants-get-command-line-options';
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
