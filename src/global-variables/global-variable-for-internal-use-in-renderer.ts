export class PlmInternalRenderer implements IPlmInternalRenderer {
  public aboutBox: PlmInternalRendererAboutBox;
  public welcomeDialog: WelcomeDialogShowable;
  public map: PlmInternalRendererMap;
}

export class PlmInternalRendererAboutBox implements AboutBoxShowable {
  public showAboutBox: () => void;
}

export class PlmInternalRendererWelcomeDialog implements WelcomeDialogShowable {
  public showWelcomeDialog: () => void;
}

export class PlmInternalRendererMap implements MapChangeable {
  public changeMap: (ipcMapChangeArg: string) => void;
}
