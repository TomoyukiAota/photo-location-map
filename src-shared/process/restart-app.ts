import { IpcConstants } from '../ipc/ipc-constants';
import { ProcessIdentifier } from './process-identifier';
import { ProxyRequire } from '../require/proxy-require';

// Relaunches the app, for a change that takes effect only on launch.
// Quits as the user does, with app.quit(), not app.exit(): app.exit() skips before-quit and will-quit, on which the
// app records quitting and keeps the analytics events it has not sent yet. app.relaunch() starts the app again once
// it has quit.
export function relaunchAndQuit(app: Pick<Electron.App, 'relaunch' | 'quit'>): void {
  app.relaunch();
  app.quit();
}

/**
 * Restarts the app. A renderer asks the main process and does not wait for an answer: the quit ends the renderer, so
 * an answer could not come. What must be kept, such as saved settings, is written before this is called.
 */
export function restartApp(): void {
  if (ProcessIdentifier.isElectronMain)
    relaunchAndQuit(ProxyRequire.electron.app);
  else
    ProxyRequire.electron.ipcRenderer.send(IpcConstants.AppRestart.Request);
}
