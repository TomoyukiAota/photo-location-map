declare var window: Window;

interface MapChangeable {
  changeMap(ipcMapChangeArg: string): void;
}

interface PlmInternalRenderer {
  map: MapChangeable;
}

interface Window {
  process: NodeJS.Process;
  require: NodeRequire;
  plmInternalRenderer: PlmInternalRenderer;
}

type DirectoryTree = ReturnType<typeof import('directory-tree')>;

declare var google: any;

declare var __karma__: any;
declare var __electronMochaMain__: any;
declare var __electronMochaRenderer__: any;
