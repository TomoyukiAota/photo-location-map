export class ProcessAccessor {
  public static getProcess(): NodeJS.Process {
    return process;
  }
}



// Before introducing @angular-builders/custom-webpack, there was an issue that process variable is overridden in Karma environment.
// Therefore, ProcessAccessor.getProcess() is implemented as below.

// import { EnvironmentDetector } from '../environment/environment-detector';
//
// export class ProcessAccessor {
//   public static getProcess(): NodeJS.Process {
//     // In Karma, process variable is overridden like following:
//     // "{"title":"browser","browser":true,"env":{},"argv":[],"version":"","versions":{}}'"
//     // window.process is kept the same as the one from Electron, so use window.process for Karma.
//     // Also, Karma is for tests on Electron renderer process, so window variable must exist.
//     // In cases other than Karma, process variable exists both on main and renderer process.
//
//     return EnvironmentDetector.isKarma
//          ? window.process
//          : process;
//   }
// }
