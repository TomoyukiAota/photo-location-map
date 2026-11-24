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

  // The sizes that the user gave the home view's panes by dragging their gutters, in CSS pixels, or '' where a
  // double-click on the gutter put the default back (src/app/home/pane-sizes/).
  export namespace HomeLayout {
    export const SidebarWidth: ReadonlyArray<string> = ['HomeLayout', 'SidebarWidth'];
    export const ChartHeight: ReadonlyArray<string> = ['HomeLayout', 'ChartHeight'];
  }

  export namespace LeafletMap {
    export const SelectedBaseLayer: ReadonlyArray<string> = ['LeafletMap', 'SelectedBaseLayer'];
    // The configs of the map's base layers that a launch last fetched, for a launch whose fetches give none
    // (src/app/map/leaflet-map/raster-tile-base-layer-configs-version-1.ts). Named with the version of their format.
    export const RasterTileBaseLayerConfigsVersion1: ReadonlyArray<string>
      = ['LeafletMap', 'RasterTileBaseLayerConfigsVersion1'];
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
    export const ThumbnailQuality: ReadonlyArray<string> = ['UserSettings', 'ThumbnailQuality'];
    export const SidebarThumbnailSize: ReadonlyArray<string> = ['UserSettings', 'SidebarThumbnailSize'];
    export const MapThumbnailSize: ReadonlyArray<string> = ['UserSettings', 'MapThumbnailSize'];
    export const StickyFolderRowsMaximum: ReadonlyArray<string> = ['UserSettings', 'StickyFolderRowsMaximum'];
    export const StickyFolderRowsLeftOut: ReadonlyArray<string> = ['UserSettings', 'StickyFolderRowsLeftOut'];
  }
}
