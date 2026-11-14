import { Analytics } from './analytics';
import { droppedEventsLabel } from './event-limiter';

let isRecorded = false;

/**
 * Records once what the limits of this process dropped (src-shared/analytics/event-limiter.ts), when there was any:
 * "Errors Dropped (Main)" or "Errors Dropped (Renderer)", with the count of each kind as the label. Called when the
 * process ends: the main process on before-quit, before the events not sent yet are saved on will-quit, and the
 * renderer when its page goes.
 */
export function recordDroppedEvents(processName: 'Main' | 'Renderer'): void {
  if (isRecorded)
    return;
  isRecorded = true;
  try {
    const label = droppedEventsLabel();
    if (label)
      Analytics.trackEvent('Errors Dropped', `Errors Dropped (${processName})`, label);
  } catch {
    // Nothing more can be done while the process ends.
  }
}
