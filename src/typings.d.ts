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

declare var __karma__: any;
