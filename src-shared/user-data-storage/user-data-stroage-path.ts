export namespace UserDataStoragePath {
  export namespace Analytics {
    export const UserId: ReadonlyArray<string> = ['Analytics', 'UserId'];
  }

  export namespace History {
    export const FirstLaunchDateTime: ReadonlyArray<string> = ['History', 'FirstLaunchDateTime'];
    export const LastLaunchDateTime: ReadonlyArray<string> = ['History', 'LastLaunchDateTime'];
    export const LaunchCount: ReadonlyArray<string> = ['History', 'LaunchCount'];
    export const ClickedOkOnWelcomeDialog: ReadonlyArray<string> = ['History', 'ClickedOkOnWelcomeDialog'];
    export const ClickedOkOnLanguageDialog: ReadonlyArray<string> = ['History', 'ClickedOkOnLanguageDialog'];
  }

  export namespace DirectoryTreeView {
    export const SortKey: ReadonlyArray<string> = ['DirectoryTreeView', 'SortKey'];
    export const SortDirection: ReadonlyArray<string> = ['DirectoryTreeView', 'SortDirection'];
  }

  export namespace FolderDialog {
    export const LastConfirmedDirectory: ReadonlyArray<string> = ['FolderDialog', 'LastConfirmedDirectory'];
  }

  export namespace LeafletMap {
    export const SelectedBaseLayer: ReadonlyArray<string> = ['LeafletMap', 'SelectedBaseLayer'];
  }

  export namespace PhotoDataViewer {
    export const WindowX: ReadonlyArray<string> = ['PhotoDataViewer', 'WindowX'];
    export const WindowY: ReadonlyArray<string> = ['PhotoDataViewer', 'WindowY'];
    export const WindowWidth: ReadonlyArray<string> = ['PhotoDataViewer', 'WindowWidth'];
    export const WindowHeight: ReadonlyArray<string> = ['PhotoDataViewer', 'WindowHeight'];
  }

  export namespace UserSettings {
    export const ShowStatusBar: ReadonlyArray<string> = ['UserSettings', 'ShowStatusBar'];
    export const DateFormat: ReadonlyArray<string> = ['UserSettings', 'DateFormat'];
    export const ClockSystemFormat: ReadonlyArray<string> = ['UserSettings', 'ClockSystemFormat'];
    export const Language: ReadonlyArray<string> = ['UserSettings', 'Language'];
  }
}
