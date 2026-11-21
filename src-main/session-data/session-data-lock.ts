import * as fs from 'fs';
import * as path from 'path';

// TL;DR: Which of the instances that run on one profile keeps Chromium's storage in the profile's folder: the one that
// holds the lock file. Any other keeps its own in a folder named after its process (session-data-setup.ts).
// Details: The lock file holds the ID of its process. A file whose process has ended, as after a crash, is taken over,
// and so is one written before the computer last started, whatever process has its ID now. An empty file is one that
// its instance is still writing, unless it has been so for a while. A process ID can be used again by another process
// before the computer restarts: the lock is then thought held, and a new instance keeps a storage of its own as long as
// that process runs, which costs it only the caches of the profile. Two instances that take over a stale lock at the
// same moment may both keep the profile's storage, as every instance did before the lock.

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

/** How long an empty lock file is taken as one that its instance is still writing. */
export const unwrittenLockMs = 10 * 1000;

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
  // The first try, and two after removing a stale lock, which another instance may take over meanwhile.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      fs.writeFileSync(lockPath, String(host.pid), { flag: 'wx' });
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST')
        throw error;
    }
    const holder = lockHolder(lockPath, host);
    if (holder === 'running')
      return false;
    if (holder === 'stale')
      fs.rmSync(lockPath, { force: true });
  }
  return false;
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
