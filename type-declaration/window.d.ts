declare var window: Window;

interface Window {
  plmInternalRenderer: IPlmInternalRenderer;
  process: NodeJS.Process;
  require: NodeRequire;
}

interface IPlmInternalRenderer {
  aboutBox: AboutBoxShowable;
  map: MapChangeable;
}

interface AboutBoxShowable {
  showAboutBox(): void;
}

interface MapChangeable {
  changeMap(ipcMapChangeArg: string): void;
}
