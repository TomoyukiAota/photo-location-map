export class PlmInternalRenderer implements IPlmInternalRenderer {
  public map: PlmInternalRendererMap;
}

export class PlmInternalRendererMap implements MapChangeable {
  public changeMap: (ipcMapChangeArg: string) => void;
}
