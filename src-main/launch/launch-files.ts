import * as fs from 'fs';
import * as path from 'path';
import { isProcessRunning } from '../../src-shared/process/is-process-running';

/** An event as Analytics.trackEvent takes it (src-shared/analytics/analytics.ts). */
export type KeptEvent = readonly [category: string, action: string, label?: string, value?: string | number];

/** A launch, told apart from the others by its process ID and the session of its events. */
export interface Launch {
  readonly pid: number;
  readonly sessionId: string;
}

/** What a launch writes of itself, so that a later launch can tell that it did not end as it should. */
export interface LaunchRecord extends Launch {
  readonly version: string;
  /** ISO 8601. */
  readonly startedAt: string;
  /** ISO 8601: when the launch last wrote its file, every minute while it runs. */
  readonly lastAliveAt: string;
  /**
   * The events that the launch tracked before its analytics were set, while they were not: those of a setup that
   * failed and stopped the launch, such as its error, which a later launch sends (src-main/launch/launch-file-setup.ts).
   */
  readonly keptEvents?: readonly KeptEvent[];
}

/**
 * A process that ran a launch is taken as still running only for so long after it last wrote its file, as its process
 * ID may have been given to another process since. Longer than any sleep of a computer, during which a running launch
 * does not write its file.
 */
export const maxSilenceMs = 7 * 24 * 60 * 60 * 1000;

/**
 * TL;DR: The files that tell, at a launch, which earlier launches did not end as they should.
 * Details: A crash of the main process, a forced quit or a power cut leaves nothing of the app running to say so.
 * Each launch writes a file of its own when it starts and every minute after, and removes it when it quits
 * (src-main/launch/launch-file-setup.ts). A file of a process that no longer runs, or that was not written for
 * maxSilenceMs, is a launch that ended otherwise. One file per launch, as two launches can run at once, named by its
 * process ID and its session: a later launch can be given the process ID of one that ended, whose file is then told
 * as ended rather than taken for its own.
 */
export class LaunchFiles {
  constructor(
    private readonly directory: string,
    private readonly isRunning: (pid: number) => boolean = isProcessRunning,
    private readonly now: () => number = Date.now,
  ) {
  }

  private fileOf(launch: Launch): string {
    return path.join(this.directory, `${launch.pid}-${launch.sessionId}.json`);
  }

  /**
   * Writes the launch's file anew: beside it first, then renamed over it, so that a launch that ends while it writes
   * leaves its earlier file whole.
   */
  public write(record: LaunchRecord): void {
    fs.mkdirSync(this.directory, { recursive: true });
    const file = this.fileOf(record);
    fs.writeFileSync(`${file}.tmp`, JSON.stringify(record));
    fs.renameSync(`${file}.tmp`, file);
  }

  public remove(launch: Launch): void {
    const file = this.fileOf(launch);
    fs.rmSync(file, { force: true });
    fs.rmSync(`${file}.tmp`, { force: true });
  }

  /**
   * The launches other than `current` that ended without removing their file, the oldest first and at most `max`,
   * whose files are removed so that each is told once; those beyond `max` are left for a later launch to tell. A file
   * that cannot be read is removed without being told.
   */
  public takeEndedAbnormally(current: Launch, max = Number.POSITIVE_INFINITY): LaunchRecord[] {
    let names: string[];
    try {
      names = fs.readdirSync(this.directory);
    } catch {
      return [];  // No launch wrote a file yet.
    }

    const ended: LaunchRecord[] = [];
    for (const name of names) {
      const match = /^(\d+)-([\w-]+)\.json$/.exec(name);
      if (!match)
        continue;
      const launch: Launch = { pid: Number(match[1]), sessionId: match[2] };
      if (launch.pid === current.pid && launch.sessionId === current.sessionId)
        continue;
      const record = this.read(launch);
      if (!record) {
        this.remove(launch);
        continue;
      }
      // A launch of the current process ID but another session has ended, as its process ID was given to this one.
      if (launch.pid === current.pid || this.hasEnded(record))
        ended.push(record);
    }
    const taken = ended.sort((a, b) => a.startedAt.localeCompare(b.startedAt)).slice(0, max);
    for (const record of taken)
      this.remove(record);
    return taken;
  }

  private hasEnded(record: LaunchRecord): boolean {
    const silenceMs = this.now() - Date.parse(record.lastAliveAt);
    return !this.isRunning(record.pid) || !(silenceMs < maxSilenceMs);
  }

  private read(launch: Launch): LaunchRecord | undefined {
    try {
      const record: unknown = JSON.parse(fs.readFileSync(this.fileOf(launch), 'utf8'));
      const { version, startedAt, lastAliveAt, keptEvents } = record as Partial<Record<keyof LaunchRecord, unknown>>;
      if (typeof version !== 'string' || typeof startedAt !== 'string' || typeof lastAliveAt !== 'string')
        return undefined;
      const events = Array.isArray(keptEvents) ? keptEvents.map(keptEventOf).filter(event => event !== undefined) : [];
      return { ...launch, version, startedAt, lastAliveAt, ...(events.length > 0 ? { keptEvents: events } : {}) };
    } catch {
      return undefined;
    }
  }
}

/** An event read from a file, or undefined; JSON writes a label or value that was not given as null. */
function keptEventOf(item: unknown): KeptEvent | undefined {
  if (!Array.isArray(item) || item.length < 2 || item.length > 4)
    return undefined;
  const [category, action, label, value] = item as unknown[];
  if (typeof category !== 'string' || typeof action !== 'string')
    return undefined;
  const givenLabel = typeof label === 'string' ? label : undefined;
  const givenValue = typeof value === 'string' || typeof value === 'number' ? value : undefined;
  if ((label ?? undefined) !== givenLabel || (value ?? undefined) !== givenValue)
    return undefined;  // A label or a value of another type.
  return [category, action, givenLabel, givenValue];
}
