import * as fs from 'fs';
import * as path from 'path';
import { isProcessRunning } from '../../src-shared/process/is-process-running';

/** What a launch writes of itself, so that a later launch can tell that it did not end as it should. */
export interface LaunchRecord {
  readonly pid: number;
  readonly sessionId: string;
  readonly version: string;
  /** ISO 8601. */
  readonly startedAt: string;
  /** ISO 8601: when the launch last wrote its file, every minute while it runs. */
  readonly lastAliveAt: string;
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
 * Each launch writes a file of its own, named by its process ID, when it starts and every minute after, and removes it
 * when it quits (src-main/launch/launch-file-setup.ts). A file of a process that no longer runs, or that was not written
 * for maxSilenceMs, is a launch that ended otherwise. One file per process, as two launches can run at once.
 */
export class LaunchFiles {
  constructor(
    private readonly directory: string,
    private readonly isRunning: (pid: number) => boolean = isProcessRunning,
    private readonly now: () => number = Date.now,
  ) {
  }

  private fileOf(pid: number): string {
    return path.join(this.directory, `${pid}.json`);
  }

  public write(record: LaunchRecord): void {
    fs.mkdirSync(this.directory, { recursive: true });
    fs.writeFileSync(this.fileOf(record.pid), JSON.stringify(record));
  }

  public remove(pid: number): void {
    fs.rmSync(this.fileOf(pid), { force: true });
  }

  /**
   * The launches other than `currentPid` that ended without removing their file, whose files are removed so that each
   * is told once; the oldest first. A file that cannot be read is removed too.
   */
  public takeEndedAbnormally(currentPid: number): LaunchRecord[] {
    let names: string[];
    try {
      names = fs.readdirSync(this.directory).filter(name => /^\d+\.json$/.test(name));
    } catch {
      return [];  // No launch wrote a file yet.
    }

    const ended: LaunchRecord[] = [];
    for (const name of names) {
      const pid = Number(name.slice(0, -'.json'.length));
      if (pid === currentPid)
        continue;
      const record = this.read(pid);
      if (record && !this.hasEnded(record))
        continue;
      this.remove(pid);
      if (record)
        ended.push(record);
    }
    return ended.sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  }

  private hasEnded(record: LaunchRecord): boolean {
    const silenceMs = this.now() - Date.parse(record.lastAliveAt);
    return !this.isRunning(record.pid) || !(silenceMs < maxSilenceMs);
  }

  private read(pid: number): LaunchRecord | undefined {
    try {
      const record: unknown = JSON.parse(fs.readFileSync(this.fileOf(pid), 'utf8'));
      const { sessionId, version, startedAt, lastAliveAt } = record as Partial<LaunchRecord>;
      return typeof sessionId === 'string' && typeof version === 'string' && typeof startedAt === 'string' && typeof lastAliveAt === 'string'
        ? { pid, sessionId, version, startedAt, lastAliveAt }
        : undefined;
    } catch {
      return undefined;
    }
  }
}
