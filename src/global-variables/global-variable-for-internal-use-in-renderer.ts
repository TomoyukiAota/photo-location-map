export class PlmInternalRenderer implements IPlmInternalRenderer {
  public aboutBox: PlmInternalRendererAboutBox;
  public settingsDialog: PlmInternalRendererSettingsDialog;
  public welcomeDialog: PlmInternalRendererWelcomeDialog;
  public map: PlmInternalRendererMap;
  public photoSelection: IPlmInternalRendererPhotoSelection;
}

export class PlmInternalRendererAboutBox implements AboutBoxShowable {
  public showAboutBox: () => void;
}

export class PlmInternalRendererSettingsDialog implements SettingsDialogShowable {
  public showSettingsDialog: () => void;
}

export class PlmInternalRendererWelcomeDialog implements WelcomeDialogShowable {
  public showWelcomeDialog: () => void;
}

export class PlmInternalRendererMap implements MapChangeable {
  public changeMap: (ipcMapChangeArg: string) => void;
}

export class PlmInternalRendererPhotoSelection implements IPlmInternalRendererPhotoSelection {
  public undo: () => void;
  public redo: () => void;
  public selectOnlyThis: (photoPath: string) => void;
}
