/* SystemJS module definition */
declare var nodeModule: NodeModule;
interface NodeModule {
  id: string;
}

declare var window: Window;
interface Window {
  process: NodeJS.Process;
  require: NodeRequire;
}

type DirectoryTree = ReturnType<typeof import('directory-tree')>;

declare var __karma__: any;
declare var __electronMochaMain__: any;
declare var __electronMochaRenderer__: any;
