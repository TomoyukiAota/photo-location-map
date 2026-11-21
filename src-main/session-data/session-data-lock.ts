import * as fs from 'fs';
import * as path from 'path';

// TL;DR: Which of the instances that run on one profile keeps Chromium's storage in the profile's folder: the one that
// holds the lock file. Any other keeps its own in a folder named after its process (session-data-setup.ts).
// Details: The lock file holds the ID of its process. A file whose process has ended, as after a crash, is taken over,
// and so is one written before the computer last started, whatever process has its ID now. An empty file is one that
// its instance is still writing, unless it has been so for a while. A process ID can be used again by another process
// before the computer restarts: the lock is then thought held, and a new instance keeps a storage of its own as long as
// that process runs, which costs it only the caches of the profile. One instance at a time takes over a stale lock
// (takeOverStaleLock), as two that did at once could each remove the lock that the other had just made.

/** What the lock and the cleanup need of the computer, so that a test can give its own. */
export interface SessionDataHost {
  /** This process's ID. */
  readonly pid: number;
  /** Whether a process with this ID runs. */
  isRunning(pid: number): boolean;
  /** The time, in ms since the epoch. */
  now(): number;
  /** When the computer last started, in ms since the epoch. */
  bootTime(): number;
}

/**
 * How long an empty lock file is taken as one that its instance is still writing, and the file of a takeover as one
 * that its instance is still making.
 */
export const unwrittenLockMs = 10 * 1000;

/** The file that the instance which takes over a stale lock at `lockPath` holds meanwhile. */
export function takeoverPath(lockPath: string): string {
  return `${lockPath}.takeover`;
}

/** Makes the file at `filePath` with this process's ID, if there is none. False when there is one already. */
function makeIfAbsent(filePath: string, host: Pick<SessionDataHost, 'pid'>): boolean {
  try {
    fs.writeFileSync(filePath, String(host.pid), { flag: 'wx' });
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST')
      return false;
    throw error;
  }
}

/** Whether the file at `filePath` was last written at least `ageMs` ago. False when it is gone. */
function isOlderThan(filePath: string, ageMs: number, host: SessionDataHost): boolean {
  try {
    return host.now() - fs.statSync(filePath).mtimeMs >= ageMs;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT')
      return false;
    throw error;
  }
}

/** Who holds the lock at `lockPath`: a running instance, nobody any more, or nobody at all as the file is gone. */
function lockHolder(lockPath: string, host: SessionDataHost): 'running' | 'stale' | 'none' {
  let text: string;
  let modifiedMs: number;
  try {
    text = fs.readFileSync(lockPath, 'utf8');
    modifiedMs = fs.statSync(lockPath).mtimeMs;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT')
      return 'none';
    throw error;
  }
  if (modifiedMs < host.bootTime())
    return 'stale';
  const pid = Number(text.trim());
  if (text.trim() === '' || !Number.isInteger(pid) || pid <= 0)
    return host.now() - modifiedMs < unwrittenLockMs ? 'running' : 'stale';
  // This process's own ID in a file that it could not create is that of an earlier process.
  return pid !== host.pid && host.isRunning(pid) ? 'running' : 'stale';
}

/**
 * Takes the lock at `lockPath` for this process. True when it holds the lock, so that it keeps Chromium's storage in
 * the profile's folder; false when another running instance holds it. Throws when the lock cannot be written at all.
 */
export function takeSessionDataLock(lockPath: string, host: SessionDataHost): boolean {
  fs.mkdirSync(path.dirname(lockPath), { recursive: true });
  if (makeIfAbsent(lockPath, host))
    return true;
  const holder = lockHolder(lockPath, host);
  if (holder === 'running')
    return false;
  // Its holder has just removed it: one more try, which another instance may win.
  if (holder === 'none')
    return makeIfAbsent(lockPath, host);
  return takeOverStaleLock(lockPath, host);
}

/**
 * TL;DR: Takes over the stale lock at `lockPath`, if this instance makes the takeover's file: one instance at a time,
 * so that none removes a lock that another has just made in place of the stale one.
 * Details: While the takeover's file is there, no other instance removes the lock, and none can make one in its place
 * while it is there either. So the lock that this instance finds stale again, holding that file, is the one that it
 * removes. Another instance may make the lock once it is removed, before this one does: this one then does not take
 * it. A takeover's file whose instance ended while making it is removed after a while; the instance that removes it
 * keeps a storage of its own, and a later launch takes over the lock.
 */
function takeOverStaleLock(lockPath: string, host: SessionDataHost): boolean {
  const takeover = takeoverPath(lockPath);
  if (!makeIfAbsent(takeover, host)) {
    if (isOlderThan(takeover, unwrittenLockMs, host))
      fs.rmSync(takeover, { force: true });
    return false;
  }
  try {
    if (lockHolder(lockPath, host) === 'running')
      return false;
    fs.rmSync(lockPath, { force: true });
    return makeIfAbsent(lockPath, host);
  } finally {
    fs.rmSync(takeover, { force: true });
  }
}

/** Removes the lock at `lockPath` if this process holds it. */
export function releaseSessionDataLock(lockPath: string, host: Pick<SessionDataHost, 'pid'>): void {
  try {
    if (fs.readFileSync(lockPath, 'utf8').trim() === String(host.pid))
      fs.rmSync(lockPath, { force: true });
  } catch {
    // Gone already, or taken over by another instance.
  }
}

/** The folder of Chromium's storage of the instance `pid` that does not hold the lock, in `instancesFolder`. */
export function instanceSessionDataFolder(instancesFolder: string, pid: number): string {
  return path.join(instancesFolder, String(pid));
}

/**
 * Removes the folders in `instancesFolder` of the instances that have ended, and returns their names. A folder that
 * cannot be removed yet, as one whose process has just ended on Windows, is left for a later launch.
 */
export async function removeEndedInstancesSessionData(instancesFolder: string, host: SessionDataHost): Promise<string[]> {
  const names = await fs.promises.readdir(instancesFolder).catch(() => [] as string[]);
  const removed: string[] = [];
  for (const name of names) {
    const pid = Number(name);
    if (!/^\d+$/.test(name) || pid === host.pid || host.isRunning(pid))
      continue;
    try {
      await fs.promises.rm(path.join(instancesFolder, name), { recursive: true, force: true });
      removed.push(name);
    } catch {
      // Left for a later launch.
    }
  }
  return removed;
}
