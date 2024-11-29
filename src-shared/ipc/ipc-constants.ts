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

  export namespace Map {
    export namespace ChangeEvent {
      export const Name = 'ipc-constants-map-change';

      export namespace Arg {
        export const GoogleMaps = 'GoogleMaps';
        export const OpenStreetMap = 'OpenStreetMap';
      }
    }
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
}
