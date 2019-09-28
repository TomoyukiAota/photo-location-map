export class PlmInternalRenderer implements IPlmInternalRenderer {
  public aboutBox: PlmInternalRendererAboutBox;
  public map: PlmInternalRendererMap;
}

export class PlmInternalRendererAboutBox implements AboutBoxShowable {
  public showAboutBox: () => void;
}

export class PlmInternalRendererMap implements MapChangeable {
  public changeMap: (ipcMapChangeArg: string) => void;
}
