import { bridge } from '../bridge/plm-bridge';

// Relaunches the app, for a change that takes effect only on launch.
// Quits as the user does, with app.quit(), not app.exit(): app.exit() skips before-quit and will-quit, on which the
// app records quitting and keeps the analytics events it has not sent yet. app.relaunch() starts the app again once
// it has quit.
// TL;DR: From an AppImage, the AppImage itself is started again, with the app's arguments.
// Details: An AppImage runs the app from a mount of its own, which its launcher removes once the app has quit, so
// app.relaunch() found no executable there: on Linux CI, the app quit and no launch followed (two e2e cases that
// relaunch it, which pass on macOS and run the packaged AppImage there). The launcher sets APPIMAGE to the
// AppImage's path, and gives the app --no-sandbox again.
export function relaunchAndQuit(app: Pick<Electron.App, 'relaunch' | 'quit'>, appImage = process.env.APPIMAGE): void {
  if (appImage)
    app.relaunch({ execPath: appImage, args: process.argv.slice(1) });
  else
    app.relaunch();
  app.quit();
}

let mainProcessRestart: (() => void) | undefined;

/** Sets how the main process restarts the app (src-main/restart-ipc-setup.ts). */
export function useMainProcessRestart(restart: () => void): void {
  mainProcessRestart = restart;
}

/**
 * Restarts the app. A renderer asks the main process and does not wait for an answer: the quit ends the renderer, so
 * an answer could not come. What must be kept, such as saved settings, is written before this is called.
 */
export function restartApp(): void {
  if (mainProcessRestart)
    mainProcessRestart();
  else
    bridge().app.restart();
}
