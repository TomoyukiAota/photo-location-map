import { bridge } from '../bridge/plm-bridge.js';

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
