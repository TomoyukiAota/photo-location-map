import { app } from 'electron';
import { Analytics } from '../src-shared/analytics/analytics';
import { Logger } from '../src-shared/log/logger';

// Records crashes of the renderer and of child processes (e.g. the GPU process), to see how often the app crashes
// and on which environments. A crash of the main process itself cannot be recorded from here.
export function configureRecordProcessGone(): void {
  app.on('render-process-gone', (_event, _webContents, details) => {
    Logger.error(`[Process Gone] Renderer process gone. Reason: ${details.reason}, exit code: ${details.exitCode}`);
    Analytics.trackEvent('Process Gone', 'Process Gone: Renderer', `Reason: ${details.reason}`, `Exit Code: ${details.exitCode}`);
  });

  app.on('child-process-gone', (_event, details) => {
    Logger.error(`[Process Gone] Child process gone. Type: ${details.type}, name: ${details.name}, reason: ${details.reason}, exit code: ${details.exitCode}`);
    Analytics.trackEvent('Process Gone', 'Process Gone: Child',
      `Type: ${details.type}, Reason: ${details.reason}`, `Exit Code: ${details.exitCode}, Name: ${details.name || ''}`);
  });
}
