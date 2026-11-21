import assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  instanceSessionDataFolder, releaseSessionDataLock, removeEndedInstancesSessionData, SessionDataHost, takeoverPath,
  takeSessionDataLock, unwrittenLockMs,
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
  const holder = () => fs.readFileSync(lockPath, 'utf8');
  /** Makes the lock file look written `ageMs` ago. */
  const age = (ageMs: number) => {
    const time = new Date(Date.now() - ageMs);
    fs.utimesSync(lockPath, time, time);
  };

  it('is taken by the first instance, and not by another while the first runs', () => {
    assert.strictEqual(takeSessionDataLock(lockPath, instance(100)), true);
    assert.strictEqual(holder(), '100');
    assert.strictEqual(takeSessionDataLock(lockPath, instance(200, [100])), false);
    assert.strictEqual(holder(), '100');
  });

  it('is taken over from an instance that has ended, and from one written before the computer started', () => {
    takeSessionDataLock(lockPath, instance(100));
    assert.strictEqual(takeSessionDataLock(lockPath, instance(200)), true);
    assert.strictEqual(holder(), '200');

    // The process ID of the lock is running again, but as another process since the computer started.
    age(2 * 3600 * 1000);
    assert.strictEqual(takeSessionDataLock(lockPath, instance(300, [200])), true);
    assert.strictEqual(holder(), '300');
  });

  it('is taken over by one instance at a time, which leaves no file of the takeover', () => {
    takeSessionDataLock(lockPath, instance(100));
    // Another instance is taking the stale lock over.
    fs.writeFileSync(takeoverPath(lockPath), '150');
    assert.strictEqual(takeSessionDataLock(lockPath, instance(200)), false);
    assert.strictEqual(holder(), '100');
    fs.rmSync(takeoverPath(lockPath));
    assert.strictEqual(takeSessionDataLock(lockPath, instance(200)), true);
    assert.strictEqual(holder(), '200');
    assert.strictEqual(fs.existsSync(takeoverPath(lockPath)), false);
  });

  it('removes the file of a takeover whose instance ended while making it, and leaves the lock to a later launch', () => {
    takeSessionDataLock(lockPath, instance(100));
    fs.writeFileSync(takeoverPath(lockPath), '150');
    const time = new Date(Date.now() - unwrittenLockMs - 1000);
    fs.utimesSync(takeoverPath(lockPath), time, time);
    assert.strictEqual(takeSessionDataLock(lockPath, instance(200)), false);
    assert.strictEqual(fs.existsSync(takeoverPath(lockPath)), false);
    assert.strictEqual(takeSessionDataLock(lockPath, instance(300)), true);
  });

  it('never removes a lock that another instance made in place of the stale one', () => {
    takeSessionDataLock(lockPath, instance(100));
    // While this instance finds the lock stale, another one takes it over: 250 runs from then on.
    let replaced = false;
    const host: SessionDataHost = { ...instance(200), isRunning: pid => {
      if (!replaced) {
        replaced = true;
        fs.rmSync(lockPath);
        fs.writeFileSync(lockPath, '250');
      }
      return pid === 250;
    } };
    assert.strictEqual(takeSessionDataLock(lockPath, host), false);
    assert.strictEqual(holder(), '250');
  });

  it('is left to an instance that is still writing it, for a while', () => {
    fs.mkdirSync(path.dirname(lockPath), { recursive: true });
    fs.writeFileSync(lockPath, '');
    assert.strictEqual(takeSessionDataLock(lockPath, instance(200)), false);
    age(unwrittenLockMs + 1000);
    assert.strictEqual(takeSessionDataLock(lockPath, instance(200)), true);
    assert.strictEqual(holder(), '200');
  });

  it('is taken over when it has this process\'s ID, as that is of an earlier process', () => {
    fs.mkdirSync(path.dirname(lockPath), { recursive: true });
    fs.writeFileSync(lockPath, '200');
    assert.strictEqual(takeSessionDataLock(lockPath, instance(200)), true);
  });

  it('cannot be taken where its folder cannot be made', () => {
    fs.writeFileSync(path.join(folder, 'instances'), 'a file where the folder would be');
    assert.throws(() => takeSessionDataLock(lockPath, instance(100)));
  });

  it('is released only by the instance that holds it', () => {
    takeSessionDataLock(lockPath, instance(100));
    releaseSessionDataLock(lockPath, { pid: 200 });
    assert.strictEqual(holder(), '100');
    releaseSessionDataLock(lockPath, { pid: 100 });
    assert.strictEqual(fs.existsSync(lockPath), false);
    releaseSessionDataLock(lockPath, { pid: 100 });
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
