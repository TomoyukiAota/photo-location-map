import { RequireFromMainProcess } from '../require/require-from-main-process';

// Restarts the app, for a change that takes effect only on launch.
// Quits as the user does, with app.quit(), not app.exit(): app.exit() skips before-quit and will-quit, on which the
// app records quitting and keeps the analytics events it has not sent yet. app.relaunch() starts the app again once
// it has quit.
export function restartApp(): void {
  RequireFromMainProcess.electron.app.relaunch();
  RequireFromMainProcess.electron.app.quit();
}
