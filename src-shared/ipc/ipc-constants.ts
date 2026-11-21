export namespace IpcConstants {
  /** What `--open` asks the app to open after it launches, checked by the main process (src-main/command-line-options/). */
  export namespace CommandLineOptions {
    export const OpenTarget = 'ipc-constants-get-open-target';
  }

  /**
   * A folder or a file that the user dropped on the main window, whose path the preload reads from the File that the
   * page gives it (src-main/dropped-item/).
   */
  export namespace DroppedItem {
    /** What the item would open, before the user confirms. */
    export const OpenTarget = 'ipc-constants-dropped-item-open-target';
    /** The item that the user confirmed, whose folder the page may then read. */
    export const Choose = 'ipc-constants-dropped-item-choose';
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
    /** Drops the thumbnails that wait to be made; those being made are finished. */
    export const Cancel = 'ipc-constants-thumbnail-generation-cancel';
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
    /** The Selection menu's Select Previous and Select Next, which act on the one selected photo (src-main/menu/selection-menu.ts). */
    export const SelectPrevious = 'ipc-constants-photo-selection-select-previous';
    export const SelectNext = 'ipc-constants-photo-selection-select-next';
    export const UpdateSelectPreviousNextMenus = 'ipc-constants-photo-selection-update-select-previous-next-menus';
    /** The Selection menu's Narrow Down to Photos with Faces, which acts on the selected photos (src/app/face-search/). */
    export const NarrowDownToPhotosWithFaces = 'ipc-constants-photo-selection-narrow-down-to-photos-with-faces';
    export const UpdateNarrowDownToPhotosWithFacesMenu = 'ipc-constants-photo-selection-update-narrow-down-to-photos-with-faces-menu';
  }

  /** The faces that a photo's metadata marks, which the search for faces takes as found (src-main/face-search/). */
  export namespace FaceRegions {
    export const Have = 'ipc-constants-face-regions-have';
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

  /**
   * The images of a HEIF photo that the main window's page decodes for its thumbnail (src-main/heif/): the file's
   * thumbnail item, the same decoded to a JPEG by libheif for a page that cannot decode HEVC, and the tiles of the
   * whole image.
   */
  export namespace Heif {
    export const EmbeddedThumbnail = 'ipc-constants-heif-embedded-thumbnail';
    export const EmbeddedThumbnailJpeg = 'ipc-constants-heif-embedded-thumbnail-jpeg';
    export const WholeImage = 'ipc-constants-heif-whole-image';
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
