import { spawn } from 'child_process';

/**
 * Relaunches the app, for a change that takes effect only on launch. Quits as the user does, with app.quit(), not
 * app.exit(): app.exit() skips before-quit and will-quit, on which the app records quitting and keeps the analytics
 * events it has not sent yet. app.relaunch() starts the app again once it has quit; from an AppImage, a shell does
 * (relaunchAppImageAfter).
 */
export function relaunchAndQuit(app: Pick<Electron.App, 'relaunch' | 'quit'>, appImage = process.env.APPIMAGE,
                                relaunchAppImage = relaunchAppImageAfter): void {
  if (appImage)
    relaunchAppImage(appImage, process.argv.slice(1));
  else
    app.relaunch();
  app.quit();
}

/**
 * TL;DR: Starts the AppImage at `appImage` with `args` once the process `pid` has ended, from a shell outside the
 * AppImage's mount.
 * Details: An AppImage runs the app from a mount of its own, which its launcher removes once the app has quit.
 * app.relaunch() starts a helper, which waits for the app to end and starts it again, from that mount too: on Linux
 * CI the app quit and nothing started, whether the helper was to start the app's executable or the AppImage
 * (two e2e cases, which relaunch the packaged app). /bin/sh waits for the app instead, and the AppImage mounts itself
 * again. Its launcher sets APPIMAGE to the AppImage's path, and gives the app --no-sandbox again.
 */
export function relaunchAppImageAfter(appImage: string, args: string[], pid = process.pid, start = spawn): void {
  const script = 'while kill -0 "$1" 2>/dev/null; do sleep 0.1; done; shift; exec "$@"';
  start('/bin/sh', ['-c', script, 'relaunch-app-image', String(pid), appImage, ...args],
    { detached: true, stdio: 'ignore' }).unref();
}
