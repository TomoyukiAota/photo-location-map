export class PlmInternalRenderer implements PlmInternalRenderer {
  public map: PlmInternalRendererMap;
}

export class PlmInternalRendererMap implements MapChangeable {
  public changeMap: (ipcMapChangeArg: string) => void;
}
