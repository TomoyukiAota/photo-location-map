declare var window: Window;

interface PlmGlobalRendererInternal {
  map: any;
}

interface Window {
  process: NodeJS.Process;
  require: NodeRequire;
  plmGlobalRendererInternal: PlmGlobalRendererInternal;
}

type DirectoryTree = ReturnType<typeof import('directory-tree')>;

declare var google: any;

declare var __karma__: any;
declare var __electronMochaMain__: any;
declare var __electronMochaRenderer__: any;
