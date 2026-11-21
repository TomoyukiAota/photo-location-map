import { createHash, randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

// TL;DR: Which of the instances that run on one profile keeps Chromium's storage in the profile's folder: the one that
// holds the lock file. Any other keeps its own in a folder named after its process (session-data-setup.ts).
// Details:
// - The lock file holds the ID of its process, and a value that no other lock has. A lock whose process has ended, as
//   after a crash, is stale, and so is one written before the computer last started, whatever process has its ID now.
//   An empty lock is one that its instance is still writing, unless it has been so for a while. A process ID can be
//   used again by another process before the computer restarts: the lock is then thought held, and a new instance
//   keeps a storage of its own as long as that process runs, which costs it only the caches of the profile.
// - No file is removed that another instance may have made in its place, as a file is removed by its path: the lock
//   is removed only by its holder, or, when stale, by the instance that holds the takeover of that very lock, and only
//   while it is still that lock (takeOverStaleLock). A takeover's file is named after the lock that it takes over, and
//   is removed only by its instance, or once that lock is gone for good (removeObsoleteTakeovers).

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

/** How long an empty lock or takeover file is taken as one that its instance is still writing. */
export const unwrittenLockMs = 10 * 1000;
/** How many takeovers of one stale lock are tried, each after the instance of the one before ended in the middle. */
const maxTakeovers = 3;

/** A lock or takeover file as it was read: what it holds, and when it was written. */
interface FoundFile {
  content: string;
  modifiedMs: number;
}

/** The file at `filePath`, or undefined when it is gone. */
function readFound(filePath: string): FoundFile | undefined {
  try {
    return { content: fs.readFileSync(filePath, 'utf8'), modifiedMs: fs.statSync(filePath).mtimeMs };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT')
      return undefined;
    throw error;
  }
}

/** The ID of the process that wrote `content`, from its first line; undefined while it is being written. */
function pidOf(content: string): number | undefined {
  const pid = Number(content.split('\n')[0].trim());
  return Number.isInteger(pid) && pid > 0 ? pid : undefined;
}

/** Whether the instance that wrote `found` runs, or is still writing it. */
function isHeld(found: FoundFile, host: SessionDataHost): boolean {
  if (found.modifiedMs < host.bootTime())
    return false;
  const pid = pidOf(found.content);
  if (pid === undefined)
    return host.now() - found.modifiedMs < unwrittenLockMs;
  // This process's own ID in a file that it did not make is that of an earlier process.
  return pid !== host.pid && host.isRunning(pid);
}

/** Whether `a` and `b` are the same file, as no two locks have the same content. */
function isSame(a: FoundFile, b: FoundFile): boolean {
  return a.content === b.content && a.modifiedMs === b.modifiedMs;
}

/** What this process writes in a file that it makes: its ID, and a value that no other file has. */
function contentOf(host: Pick<SessionDataHost, 'pid'>): string {
  return `${host.pid}\n${randomUUID()}`;
}

/** Makes the file at `filePath` for this process, if there is none. False when there is one already. */
function makeIfAbsent(filePath: string, host: Pick<SessionDataHost, 'pid'>): boolean {
  try {
    fs.writeFileSync(filePath, contentOf(host), { flag: 'wx' });
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST')
      return false;
    throw error;
  }
}

/** The name that the takeovers of the lock `found` share, which no other lock's takeovers have. */
function takeoverName(found: FoundFile): string {
  return createHash('sha256').update(found.content).update(`\n${found.modifiedMs}`).digest('hex').slice(0, 16);
}

/** The file of the `attempt`th takeover of the lock `found` at `lockPath`. */
export function takeoverPath(lockPath: string, found: FoundFile, attempt: number): string {
  return `${lockPath}.takeover-${takeoverName(found)}-${attempt}`;
}

/** The lock at `lockPath` as it is now, for a test to name its takeovers; undefined when there is none. */
export function readSessionDataLock(lockPath: string): FoundFile | undefined {
  return readFound(lockPath);
}

/**
 * Takes the lock at `lockPath` for this process. True when it holds the lock, so that it keeps Chromium's storage in
 * the profile's folder; false when another instance holds it, or may. Throws when the lock cannot be written or read.
 */
export function takeSessionDataLock(lockPath: string, host: SessionDataHost): boolean {
  fs.mkdirSync(path.dirname(lockPath), { recursive: true });
  if (makeIfAbsent(lockPath, host))
    return true;
  const found = readFound(lockPath);
  // Its holder has just removed it: one more try, which another instance may win.
  if (found === undefined)
    return makeIfAbsent(lockPath, host);
  if (isHeld(found, host))
    return false;
  return takeOverStaleLock(lockPath, found, host);
}

/**
 * TL;DR: Takes over the stale lock `stale` at `lockPath`, if this instance makes the file of its takeover: one instance
 * at a time, and only while the lock is still `stale`.
 * Details: While this instance holds the takeover's file, no other instance takes over `stale`, and none can make a
 * lock in its place while it is there: so the lock that this instance removes is `stale`, which it checks again.
 * Another instance may make a lock once `stale` is gone, before this one does: this one then does not take it. When
 * the instance of a takeover has ended in the middle of it, its file is left, and the next attempt has a file of its
 * own; removeObsoleteTakeovers removes the files once the lock is no longer `stale`.
 */
function takeOverStaleLock(lockPath: string, stale: FoundFile, host: SessionDataHost): boolean {
  for (let attempt = 1; attempt <= maxTakeovers; attempt++) {
    const takeover = takeoverPath(lockPath, stale, attempt);
    if (!makeIfAbsent(takeover, host)) {
      const other = readFound(takeover);
      // Another instance takes the lock over, or has just done so.
      if (other === undefined || isHeld(other, host))
        return false;
      continue;
    }
    try {
      const current = readFound(lockPath);
      if (current === undefined)
        return makeIfAbsent(lockPath, host);
      if (!isSame(current, stale))
        return false;
      fs.rmSync(lockPath, { force: true });
      return makeIfAbsent(lockPath, host);
    } finally {
      fs.rmSync(takeover, { force: true });
    }
  }
  return false;
}

/** Removes the lock at `lockPath` if this process holds it: one that it made, which has its ID. */
export function releaseSessionDataLock(lockPath: string, host: Pick<SessionDataHost, 'pid'>): void {
  try {
    if (pidOf(fs.readFileSync(lockPath, 'utf8')) === host.pid)
      fs.rmSync(lockPath, { force: true });
  } catch {
    // Gone already, or taken over by another instance.
  }
}

/**
 * Removes the files of the takeovers, next to the lock at `lockPath`, of locks that are gone, and returns their names.
 * Such a lock does not come back, as no two locks have the same content: nobody takes it over again.
 */
export async function removeObsoleteTakeovers(lockPath: string): Promise<string[]> {
  const folder = path.dirname(lockPath);
  const prefix = `${path.basename(lockPath)}.takeover-`;
  const current = readFound(lockPath);
  const currentName = current === undefined ? undefined : takeoverName(current);
  const names = await fs.promises.readdir(folder).catch(() => [] as string[]);
  const removed: string[] = [];
  for (const name of names) {
    if (!name.startsWith(prefix) || name.slice(prefix.length).startsWith(`${currentName}-`))
      continue;
    await fs.promises.rm(path.join(folder, name), { force: true }).then(() => removed.push(name), () => {});
  }
  return removed;
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
