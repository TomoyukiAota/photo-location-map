import { plmBridge, whenBridgeReady } from '../src-shared/bridge/plm-bridge';

/**
 * Writes why the app could not start to the console and, through the bridge, to the log file, as the logger is one of
 * the app's modules (src-shared/log/logger.ts). Without a bridge the preload failed, which the main process logs.
 */
function reportStartFailure(error: unknown): void {
  console.error('The app could not start.', error);
  const details = error instanceof Error ? error.stack ?? error.message : String(error);
  plmBridge()?.log.append(`[${new Date().toISOString()}] [Renderer] [error] The app could not start: ${details}`);
}

// The page's entry: the app (src/start-app.ts) once the page has its bridge to the main process, which the app's
// modules read while they are evaluated (src-shared/bridge/plm-bridge.ts, whenBridgeReady).
whenBridgeReady()
  .then(() => import('./start-app'))
  .catch(reportStartFailure);
