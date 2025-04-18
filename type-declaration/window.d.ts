declare var window: Window;

interface Window {
  plmInternalRenderer: IPlmInternalRenderer;
  process: NodeJS.Process;
  require: NodeRequire;
}

interface IPlmInternalRenderer {
  recordAtAppLaunch: IPlmInternalRendererRecordAtAppLaunch;
  aboutBox: AboutBoxShowable;
  settingsDialog: SettingsDialogShowable;
  welcomeDialog: WelcomeDialogShowable;
  map: MapChangeable;
  photoSelection: IPlmInternalRendererPhotoSelection;
}

interface IPlmInternalRendererRecordAtAppLaunch {
  handleRecordAtAppLaunchFinished(): void;
}

interface AboutBoxShowable {
  showAboutBox(): void;
}

interface SettingsDialogShowable {
  showSettingsDialog(): void;
}

interface WelcomeDialogShowable {
  showWelcomeDialog(): void;
}

interface MapChangeable {
  changeMap(ipcMapChangeArg: string): void;
}

interface IPlmInternalRendererPhotoSelection {
  undo(): void;
  redo(): void;
  selectOnlyThis(photoPath: string): void;
}
