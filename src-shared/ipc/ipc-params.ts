export namespace IpcParams {
  export namespace PhotoSelection {
    export interface UpdateUndoRedoMenus {
      isUndoMenuEnabled: boolean;
      isRedoMenuEnabled: boolean;
    }

    export interface UpdateSelectPreviousNextMenus {
      isSelectPreviousMenuEnabled: boolean;
      isSelectNextMenuEnabled: boolean;
    }

    export interface UpdateNarrowDownToPhotosWithFacesMenu {
      isEnabled: boolean;
    }
  }
}
