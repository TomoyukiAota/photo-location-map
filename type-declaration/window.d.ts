declare var window: Window;

interface Window {
  plmInternalRenderer: IPlmInternalRenderer;
  process: NodeJS.Process;
  require: NodeRequire;
}

interface IPlmInternalRenderer {
  aboutBox: AboutBoxShowable;
  settingsDialog: SettingsDialogShowable;
  welcomeDialog: WelcomeDialogShowable;
  map: MapChangeable;
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
