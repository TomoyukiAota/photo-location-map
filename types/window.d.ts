declare var window: Window;

// The main window's page has no Node.js: no window.process or window.require (src-shared/bridge/plm-bridge.ts).
interface Window {
  plmInternalRenderer: IPlmInternalRenderer;
}

interface IPlmInternalRenderer {
  recordAtAppLaunch: IPlmInternalRendererRecordAtAppLaunch;
  aboutBox: AboutBoxShowable;
  settingsDialog: SettingsDialogShowable;
  welcomeDialog: WelcomeDialogShowable;
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

interface IPlmInternalRendererPhotoSelection {
  undo(): void;
  redo(): void;
  selectOnlyThis(photoPath: string): void;
}
