/* eslint-disable @typescript-eslint/no-require-imports -- fs and path are loaded where the main process calls, not at the top: see the class. */
import { AnalyticsBackendEvent } from './analytics-backend-event';

// Keeps the events that were not sent yet, to send them on the next launch.
// fs is required where it is used, not imported at the top: the renderer bundle also loads this file through
// the IPC module, and only the main process uses it.
export class UnsentEventsFile {
  constructor(public readonly filePath: string) {
  }

  /** Writes the events, or removes the file when there are none. */
  public save(events: readonly AnalyticsBackendEvent[]): void {
    const fs: typeof import('fs') = require('fs');
    if (events.length > 0) {
      fs.writeFileSync(this.filePath, JSON.stringify(events));
    } else if (fs.existsSync(this.filePath)) {
      fs.unlinkSync(this.filePath);
    }
  }

  /**
   * Reads the events; anything in the file that is not an event is skipped, and a file that cannot be read as events
   * gives none.
   */
  public load(): AnalyticsBackendEvent[] {
    const fs: typeof import('fs') = require('fs');
    if (!fs.existsSync(this.filePath))
      return [];

    try {
      const parsed: unknown = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
      return Array.isArray(parsed) ? parsed.filter(isEventLike) : [];
    } catch {
      return [];
    }
  }

  public remove(): void {
    const fs: typeof import('fs') = require('fs');
    fs.rmSync(this.filePath, { force: true });
  }

  /**
   * Reads the events and removes the file, so that they are sent once. A file that cannot be read as events is
   * removed too, so that it does not fail on every launch.
   */
  public loadAndRemove(): AnalyticsBackendEvent[] {
    try {
      return this.load();
    } finally {
      this.remove();
    }
  }
}

/** A launch's file is taken as left by a launch that ended once it was not written for so long (as launch files). */
export const maxUnwrittenMs = 7 * 24 * 60 * 60 * 1000;

/**
 * TL;DR: The files of one endpoint's unsent events: each launch's own, named by its process ID, and those that ended
 * launches left.
 * Details: A launch saves its unsent events when it tracks an error, so that they are not lost if it then crashes,
 * and when it quits. Two launches can run at once, so each has its file. A launch takes over the files of launches
 * whose process no longer runs, or that were not written for maxUnwrittenMs, and the one file that versions before
 * this kept for all launches.
 */
export class UnsentEventsFiles {
  constructor(
    private readonly directory: string,
    private readonly endpointName: string,
    private readonly isRunning: (pid: number) => boolean,
    private readonly now: () => number = Date.now,
  ) {
  }

  private get prefix(): string {
    return `analytics-backend-unsent-events-${this.endpointName}`;
  }

  /** The file of the launch whose process ID is `pid`. */
  public own(pid: number): UnsentEventsFile {
    const path: typeof import('path') = require('path');
    return new UnsentEventsFile(path.join(this.directory, `${this.prefix}-${pid}.json`));
  }

  /** The files that ended launches left, for the launch whose process ID is `currentPid`. */
  public left(currentPid: number): UnsentEventsFile[] {
    const fs: typeof import('fs') = require('fs');
    const path: typeof import('path') = require('path');
    let names: string[];
    try {
      names = fs.readdirSync(this.directory);
    } catch {
      return [];
    }

    const files: UnsentEventsFile[] = [];
    for (const name of names) {
      if (name === `${this.prefix}.json`) {
        files.push(new UnsentEventsFile(path.join(this.directory, name)));
        continue;
      }
      const match = new RegExp(`^${this.prefix}-(\\d+)\\.json$`).exec(name);
      if (!match || Number(match[1]) === currentPid)
        continue;
      const filePath = path.join(this.directory, name);
      if (!this.isRunning(Number(match[1])) || !(this.now() - this.modifiedAt(filePath) < maxUnwrittenMs))
        files.push(new UnsentEventsFile(filePath));
    }
    return files;
  }

  private modifiedAt(filePath: string): number {
    const fs: typeof import('fs') = require('fs');
    try {
      return fs.statSync(filePath).mtimeMs;
    } catch {
      return 0;
    }
  }
}

function isEventLike(item: unknown): item is AnalyticsBackendEvent {
  return typeof item === 'object' && item !== null && typeof (item as AnalyticsBackendEvent).event_id === 'string';
}
