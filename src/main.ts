import { errorForAnalytics } from '../src-shared/analytics/error-for-analytics';
import { plmBridge, whenBridgeReady } from '../src-shared/bridge/plm-bridge';

/**
 * Writes why the app could not start to the console and, through the bridge, to the log file, as the logger is one of
 * the app's modules (src-shared/log/logger.ts), and records it as an error that nothing handled, without paths, to the
 * analytics backend through the bridge too: the analytics are among the modules that did not load, and so are the
 * browser SDKs, which do not get it. Without a bridge the preload failed, which the main process logs and records.
 */
function reportStartFailure(error: unknown): void {
  console.error('The app could not start.', error);
  const bridge = plmBridge();
  const details = error instanceof Error ? error.stack ?? error.message : String(error);
  bridge?.log.append(`[${new Date().toISOString()}] [Renderer] [error] The app could not start: ${details}`);
  try {
    const sensitiveStrings = [bridge?.startup?.homeDir, bridge?.startup?.userName].filter((text): text is string => !!text);
    const { label, value } = errorForAnalytics(error, { appPaths: [], sensitiveStrings });
    bridge?.analytics.sendToBackend('Unhandled Error', 'Unhandled Error (Renderer)', label, value);
  } catch {
    // Nothing more can be done here.
  }
}

/**
 * TL;DR: Writes to the console what the page's Content Security Policy refused to evaluate, as Chromium writes the
 * policy's other refusals, so that the main process logs and records it (src-main/record-console-errors.ts).
 * Details: For eval(), new Function() and a WebAssembly module to compile, Chromium writes no line, as they throw an
 * EvalError or a CompileError instead, which the code may catch, as a library that falls back on another way does
 * (src-main/file-server/content-security-policy.ts). A string given to setTimeout() throws nothing, and gets
 * Chromium's line as well as this one. Set here, before the app's modules are evaluated.
 */
function reportRefusedEvaluations(): void {
  document.addEventListener('securitypolicyviolation', event => {
    if (event.blockedURI === 'eval' || event.blockedURI === 'wasm-eval')
      console.error(`The Content Security Policy refused to evaluate (${event.effectiveDirective} ${event.blockedURI}) at `
        + `${event.sourceFile}:${event.lineNumber}:${event.columnNumber}.`);
  });
}

reportRefusedEvaluations();
// The page's entry: the app (src/start-app.ts) once the page has its bridge to the main process, which the app's
// modules read while they are evaluated (src-shared/bridge/plm-bridge.ts, whenBridgeReady).
whenBridgeReady()
  .then(() => import('./start-app'))
  .catch(reportStartFailure);
