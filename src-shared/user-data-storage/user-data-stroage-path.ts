export namespace UserDataStoragePath {
  export namespace Analytics {
    export const UserId: ReadonlyArray<string> = ['Analytics', 'UserId'];
  }

  export namespace History {
    export const FirstLaunchDateTime: ReadonlyArray<string> = ['History', 'FirstLaunchDateTime'];
    export const LastLaunchDateTime: ReadonlyArray<string> = ['History', 'LastLaunchDateTime'];
    export const LaunchCount: ReadonlyArray<string> = ['History', 'LaunchCount'];
    export const ClickedOkOnWelcomeDialog: ReadonlyArray<string> = ['History', 'ClickedOkOnWelcomeDialog'];
  }

  export namespace GoogleMaps {
    export const ApiKey: ReadonlyArray<string> = ['GoogleMaps', 'ApiKey'];
  }

  export namespace LeafletMap {
    export const SelectedLayer: ReadonlyArray<string> = ['LeafletMap', 'SelectedLayer'];
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
  }
}
