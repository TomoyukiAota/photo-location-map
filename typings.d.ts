/* SystemJS module definition */
declare var nodeModule: NodeModule;
interface NodeModule {
  id: string;
}

interface NodeRequireFunction {
  // Add overloads here in order to add return types of global.require and window.require functions.
  (id: 'child_process'): typeof import('child_process');
  (id: 'fs'): typeof import('fs');
  (id: 'fs-extra'): typeof import('fs-extra');
  (id: 'os'): typeof import('os');
  (id: 'path'): typeof import('path');
}

declare namespace Electron {
  interface Remote {
    // Add overloads here in order to add return types of window.require('electron').remote.require function.
    require(module: 'fs-extra'): typeof import('fs-extra');
    require(module: 'os'): typeof import('os');
  }
}

declare var window: Window;
interface Window {
  process: NodeJS.Process;
  require: NodeRequire;
}

declare module 'exif-parser';
interface ExifParserResult {
}

type DirectoryTree = ReturnType<typeof import('directory-tree')>;

declare var __karma__: any;
declare var __electronMochaMain__: any;
