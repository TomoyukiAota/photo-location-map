import { whenBridgeReady } from '../src-shared/bridge/plm-bridge';

// The page's entry: the app (src/start-app.ts) once the page has its bridge to the main process, which the app's
// modules read while they are evaluated (src-shared/bridge/plm-bridge.ts, whenBridgeReady).
whenBridgeReady()
  .then(() => import('./start-app'))
  .catch(error => console.error('The app could not start.', error));
