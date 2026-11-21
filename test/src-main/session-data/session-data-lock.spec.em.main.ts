import assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  abandonedTakeoverMs, instanceSessionDataFolder, readSessionDataLock, releaseSessionDataLock, removeEndedInstancesSessionData,
  removeObsoleteTakeovers, SessionDataHost, takeoverPath, takeSessionDataLock, unwrittenLockMs,
} from '../../../src-main/session-data/session-data-lock.js';

describe('The lock of the session data shared by the instances on one profile (in main process)', () => {
  let folder: string;
  let lockPath: string;

  beforeEach(() => {
    folder = fs.mkdtempSync(path.join(os.tmpdir(), 'plm-session-data-'));
    lockPath = path.join(folder, 'instances', 'shared-session-data.lock');
  });

  afterEach(() => fs.rmSync(folder, { recursive: true, force: true }));

  /** An instance `pid` on a computer where the processes `running` run, and which started an hour ago. */
  const instance = (pid: number, running: number[] = []): SessionDataHost => ({
    pid, isRunning: candidate => candidate === pid || running.includes(candidate),
    now: () => Date.now(), bootTime: () => Date.now() - 3600 * 1000,
  });
  /** The ID of the process that holds the lock. */
  const holder = () => Number(fs.readFileSync(lockPath, 'utf8').split('\n')[0]);
  /** Writes a file at `filePath` as the instance `pid` makes it. */
  const write = (filePath: string, pid: number | '') => {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, pid === '' ? '' : `${pid}\n${Math.random()}`);
  };
  /** Makes the file at `filePath` look written `ageMs` ago. */
  const age = (filePath: string, ageMs: number) => {
    const time = new Date(Date.now() - ageMs);
    fs.utimesSync(filePath, time, time);
  };
  /** The file of the `attempt`th takeover of the lock as it is now. */
  const takeover = (attempt: number) => takeoverPath(lockPath, readSessionDataLock(lockPath)!, attempt);
  const takeovers = () => fs.readdirSync(path.dirname(lockPath)).filter(name => name.includes('.takeover-'));

  it('is taken by the first instance, and not by another while the first runs', () => {
    assert.strictEqual(takeSessionDataLock(lockPath, instance(100)), true);
    assert.strictEqual(holder(), 100);
    assert.strictEqual(takeSessionDataLock(lockPath, instance(200, [100])), false);
    assert.strictEqual(holder(), 100);
  });

  it('is taken over from an instance that has ended, and from one written before the computer started', () => {
    write(lockPath, 100);
    assert.strictEqual(takeSessionDataLock(lockPath, instance(200)), true);
    assert.strictEqual(holder(), 200);

    // The process ID of the lock is running again, but as another process since the computer started.
    age(lockPath, 2 * 3600 * 1000);
    assert.strictEqual(takeSessionDataLock(lockPath, instance(300, [200])), true);
    assert.strictEqual(holder(), 300);
    assert.deepStrictEqual(takeovers(), []);
  });

  it('is left to an instance that is still writing it, for a while', () => {
    write(lockPath, '');
    assert.strictEqual(takeSessionDataLock(lockPath, instance(200)), false);
    age(lockPath, unwrittenLockMs + 1000);
    assert.strictEqual(takeSessionDataLock(lockPath, instance(200)), true);
    assert.strictEqual(holder(), 200);
  });

  it('is taken over when it has this process\'s ID, as that is of an earlier process', () => {
    write(lockPath, 200);
    assert.strictEqual(takeSessionDataLock(lockPath, instance(200)), true);
  });

  it('cannot be taken where its folder cannot be made', () => {
    fs.writeFileSync(path.join(folder, 'instances'), 'a file where the folder would be');
    assert.throws(() => takeSessionDataLock(lockPath, instance(100)));
  });

  it('is released only by the instance that holds it', () => {
    takeSessionDataLock(lockPath, instance(100));
    releaseSessionDataLock(lockPath, { pid: 200 });
    assert.strictEqual(holder(), 100);
    releaseSessionDataLock(lockPath, { pid: 100 });
    assert.strictEqual(fs.existsSync(lockPath), false);
    releaseSessionDataLock(lockPath, { pid: 100 });
  });

  describe('when stale, is taken over by one instance at a time', () => {
    it('and not while another instance takes it over', () => {
      write(lockPath, 100);
      write(takeover(1), 150);
      assert.strictEqual(takeSessionDataLock(lockPath, instance(200, [150])), false);
      assert.strictEqual(holder(), 100);
      assert.strictEqual(takeovers().length, 1);
    });

    it('with the next takeover when the instance of one ended in the middle, whose file the cleanup removes later', async () => {
      write(lockPath, 100);
      age(lockPath, 5000);
      const abandoned = takeover(1);
      write(abandoned, 150);
      assert.strictEqual(takeSessionDataLock(lockPath, instance(200)), true);
      assert.strictEqual(holder(), 200);
      // Its own takeover's file is gone; the abandoned one is left while the taking over can still go on.
      assert.deepStrictEqual(takeovers(), [path.basename(abandoned)]);
      age(abandoned, abandonedTakeoverMs + 1000);
      assert.deepStrictEqual(await removeObsoleteTakeovers(lockPath, instance(200)), [path.basename(abandoned)]);
      assert.deepStrictEqual(takeovers(), []);
    });

    it('and by nobody after three takeovers whose instances ended in the middle', () => {
      write(lockPath, 100);
      for (const attempt of [1, 2, 3])
        write(takeover(attempt), 150 + attempt);
      assert.strictEqual(takeSessionDataLock(lockPath, instance(200)), false);
      assert.strictEqual(holder(), 100);
    });

    it('which removes no lock that another instance made in its place', () => {
      write(lockPath, 100);
      // While this instance finds the lock stale, another one takes it over, and runs from then on.
      let replaced = false;
      const host: SessionDataHost = { ...instance(200), isRunning: pid => {
        if (!replaced) {
          replaced = true;
          fs.rmSync(lockPath);
          write(lockPath, 250);
        }
        return pid === 250;
      } };
      assert.strictEqual(takeSessionDataLock(lockPath, host), false);
      assert.strictEqual(holder(), 250);
      assert.deepStrictEqual(takeovers(), []);
    });

    it('which makes the lock without removing anything when the stale one is gone', () => {
      write(lockPath, 100);
      // While this instance finds the lock stale, its instance removes it.
      let removed = false;
      const host: SessionDataHost = { ...instance(200), isRunning: () => {
        if (!removed) {
          removed = true;
          fs.rmSync(lockPath);
        }
        return false;
      } };
      assert.strictEqual(takeSessionDataLock(lockPath, host), true);
      assert.strictEqual(holder(), 200);
    });
  });

  describe('removes the takeovers', () => {
    const hour = 3600 * 1000;
    /** The file of a takeover, written `fileAgeMs` ago, of a lock written at `lockWrittenMs`. */
    const takeoverOf = (lockWrittenMs: number, fileAgeMs: number) => {
      const filePath = takeoverPath(lockPath, { content: `90\n${Math.random()}`, modifiedMs: lockWrittenMs }, 1);
      write(filePath, 95);
      age(filePath, fileAgeMs);
      return path.basename(filePath);
    };

    it('over an hour old of a lock written before the lock that is there now, and no other', async () => {
      write(lockPath, 100);
      const lockWrittenMs = readSessionDataLock(lockPath)!.modifiedMs;
      const obsolete = takeoverOf(lockWrittenMs - 2 * hour, 2 * hour);
      const recent = takeoverOf(lockWrittenMs - 2 * hour, 60 * 1000);
      const ofThisLock = path.basename(takeover(1));
      write(takeover(1), 150);
      age(takeover(1), 2 * hour);
      // As when the lock changed after the cleanup read it: a lock written later than the one read, which may be stale.
      const ofLaterLock = takeoverOf(lockWrittenMs + hour, 2 * hour);
      assert.deepStrictEqual(await removeObsoleteTakeovers(lockPath, instance(200)), [obsolete]);
      assert.deepStrictEqual(takeovers().sort(), [recent, ofThisLock, ofLaterLock].sort());
    });

    it('not at all while there is no lock', async () => {
      const obsolete = takeoverOf(Date.now() - 3 * hour, 2 * hour);
      assert.deepStrictEqual(await removeObsoleteTakeovers(lockPath, instance(200)), []);
      assert.deepStrictEqual(takeovers(), [obsolete]);
    });
  });

  it('leaves, when removing the storage of the instances that have ended, that of the running ones and other files', async () => {
    const instances = path.dirname(lockPath);
    takeSessionDataLock(lockPath, instance(100));
    for (const pid of [200, 300, 400]) {
      fs.mkdirSync(path.join(instanceSessionDataFolder(instances, pid), 'Local Storage'), { recursive: true });
      fs.writeFileSync(path.join(instanceSessionDataFolder(instances, pid), 'Local Storage', 'LOCK'), '');
    }
    fs.mkdirSync(path.join(instances, 'notes'));

    // This process is 400; 300 runs; 200 has ended.
    const removed = await removeEndedInstancesSessionData(instances, instance(400, [300]));
    assert.deepStrictEqual(removed, ['200']);
    assert.deepStrictEqual(fs.readdirSync(instances).sort(), ['300', '400', 'notes', 'shared-session-data.lock']);
    assert.deepStrictEqual(await removeEndedInstancesSessionData(path.join(folder, 'missing'), instance(400)), []);
  });
});
