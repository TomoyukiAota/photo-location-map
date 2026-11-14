import * as fs from 'fs';
import * as path from 'path';
import { AnalyticsBackendEvent } from './analytics-backend-event.js';

// Keeps the events that were not sent yet, to send them on the next launch. Only the main process loads this file.
export class UnsentEventsFile {
  constructor(public readonly filePath: string) {
  }

  /**
   * Writes the events, or removes the file when there are none. They are written beside the file first and then
   * renamed over it, so that a launch that ends or fails while writing leaves the events that the file held, which can
   * be another launch's that it took over.
   */
  public save(events: readonly AnalyticsBackendEvent[]): void {
    if (events.length > 0) {
      const beside = `${this.filePath}.tmp`;
      try {
        fs.writeFileSync(beside, JSON.stringify(events));
        fs.renameSync(beside, this.filePath);
      } catch (error) {
        try {
          fs.rmSync(beside, { force: true });
        } catch {
          // The failure to save is what the caller is told of.
        }
        throw error;
      }
    } else if (fs.existsSync(this.filePath)) {
      fs.unlinkSync(this.filePath);
    }
  }

  /**
   * Reads the events; anything in the file that is not an event is skipped, and a file that cannot be read as events
   * gives none.
   */
  public load(): AnalyticsBackendEvent[] {
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
    fs.rmSync(this.filePath, { force: true });
    fs.rmSync(`${this.filePath}.tmp`, { force: true });  // Left by a launch that ended while saving.
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
    return new UnsentEventsFile(path.join(this.directory, `${this.prefix}-${pid}.json`));
  }

  /** The files that ended launches left, for the launch whose process ID is `currentPid`. */
  public left(currentPid: number): UnsentEventsFile[] {
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

  /**
   * TL;DR: The events of the files that ended launches left, written into the file of the launch whose process ID is
   * `currentPid` before those are removed, so that none is lost if that launch ends before sending them.
   * Details: The launch's own file is taken over too: before the launch writes it, it is the file of an earlier launch
   * that was given the same process ID. A file whose events could not be written into the launch's own file is kept,
   * and so is a file that cannot be removed: a later launch takes it over again, and its events may be sent twice,
   * which the analytics backend drops by their event_id, rather than not at all. `warn` is told of each such file.
   */
  public takeOver(currentPid: number, warn: (message: string) => void): AnalyticsBackendEvent[] {
    const own = this.own(currentPid);
    const left = this.left(currentPid);
    const events = [own, ...left].flatMap(file => file.load());
    if (events.length > 0) {
      try {
        own.save(events);
      } catch (error) {
        warn(`Failed to save the unsent events taken over, which a later launch takes over again: ${error}`);
        return events;
      }
    }
    for (const file of left) {
      try {
        file.remove();
      } catch (error) {
        warn(`Failed to remove a file of unsent events, which a later launch may send again: ${error}`);
      }
    }
    return events;
  }

  private modifiedAt(filePath: string): number {
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
