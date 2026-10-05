import { app } from 'electron';
import { Analytics } from '../src-shared/analytics/analytics';
import { Logger } from '../src-shared/log/logger';

let isRecorded = false;

// Records quitting, with how long the app ran. On before-quit, the first event of quitting; the analytics backend
// saves what it could not send yet on will-quit, which comes after, so this event is not lost.
// before-quit can come again if quitting is cancelled, so it is recorded once.
export function configureRecordAtAppQuit(): void {
  app.on('before-quit', () => {
    if (isRecorded)
      return;

    isRecorded = true;
    const sessionLengthSeconds = Math.round(process.uptime());
    Analytics.trackEvent('App Quit', 'App Quit', `Session Length (s): ${sessionLengthSeconds}`, sessionLengthSeconds);
    Logger.info(`[App Quit] Session length: ${sessionLengthSeconds} s`);
  });
}
