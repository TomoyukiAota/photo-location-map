import { AnalyticsBackendEvent } from './analytics-backend-event';

// Keeps the events that were not sent before quitting, to send them on the next launch.
// fs is required where it is used, not imported at the top: the renderer bundle also loads this file through
// the IPC module, and only the main process uses it.
export class UnsentEventsFile {
  constructor(private readonly filePath: string) {
  }

  /** Writes the events, or removes the file when there are none. */
  public save(events: AnalyticsBackendEvent[]): void {
    const fs: typeof import('fs') = require('fs');
    if (events.length > 0) {
      fs.writeFileSync(this.filePath, JSON.stringify(events));
    } else if (fs.existsSync(this.filePath)) {
      fs.unlinkSync(this.filePath);
    }
  }

  /**
   * Reads the events and removes the file, so that they are sent once. A file that cannot be read as events is
   * removed too, so that it does not fail on every launch; anything in it that is not an event is skipped.
   */
  public loadAndRemove(): AnalyticsBackendEvent[] {
    const fs: typeof import('fs') = require('fs');
    if (!fs.existsSync(this.filePath))
      return [];

    try {
      const parsed: unknown = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
      return Array.isArray(parsed) ? parsed.filter(isEventLike) : [];
    } catch {
      return [];
    } finally {
      fs.unlinkSync(this.filePath);
    }
  }
}

function isEventLike(item: unknown): item is AnalyticsBackendEvent {
  return typeof item === 'object' && item !== null && typeof (item as AnalyticsBackendEvent).event_id === 'string';
}
