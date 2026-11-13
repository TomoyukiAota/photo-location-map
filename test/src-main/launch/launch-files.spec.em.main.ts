import assert = require('assert');
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { LaunchFiles, LaunchRecord, maxSilenceMs } from '../../../src-main/launch/launch-files';

describe('LaunchFiles', () => {
  const now = Date.parse('2026-11-14T00:00:00.000Z');
  const minutesAgo = (minutes: number) => new Date(now - minutes * 60 * 1000).toISOString();
  const launch = (pid: number, lastAliveAt = minutesAgo(1)): LaunchRecord =>
    ({ pid, sessionId: `session-${pid}`, version: '1.13.0', startedAt: minutesAgo(60 + pid), lastAliveAt });
  let directory: string;

  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'plm-launch-files-'));
  });

  afterEach(() => {
    fs.rmSync(directory, { recursive: true, force: true });
  });

  it('should tell the launches whose process no longer runs, once, and keep those that run', () => {
    const running = new Set([10, 20]);
    const files = new LaunchFiles(directory, pid => running.has(pid), () => now);
    for (const pid of [10, 20, 30, 40])
      files.write(launch(pid));

    const ended = files.takeEndedAbnormally(10);

    assert.deepEqual(ended.map(record => record.pid), [40, 30]);  // The oldest first.
    assert.deepEqual(ended[0], launch(40));
    assert.deepEqual(fs.readdirSync(directory).sort(), ['10.json', '20.json']);
    assert.deepEqual(files.takeEndedAbnormally(10), []);
  });

  it('should take a launch whose file was not written for too long as ended, as its process ID may be another\'s', () => {
    const files = new LaunchFiles(directory, () => true, () => now);
    files.write(launch(20, new Date(now - maxSilenceMs - 1).toISOString()));
    files.write(launch(30, minutesAgo(24 * 60)));  // A computer that slept for a day.

    assert.deepEqual(files.takeEndedAbnormally(10).map(record => record.pid), [20]);
  });

  it('should remove a file that cannot be read, without telling it', () => {
    const files = new LaunchFiles(directory, () => false, () => now);
    fs.writeFileSync(path.join(directory, '50.json'), 'not JSON');
    fs.writeFileSync(path.join(directory, 'other.txt'), 'kept');

    assert.deepEqual(files.takeEndedAbnormally(10), []);
    assert.deepEqual(fs.readdirSync(directory), ['other.txt']);
  });

  it('should tell nothing when no launch wrote a file yet', () => {
    const files = new LaunchFiles(path.join(directory, 'not-yet'), () => false, () => now);

    assert.deepEqual(files.takeEndedAbnormally(10), []);
  });

  it('should remove its own file', () => {
    const files = new LaunchFiles(directory, () => false, () => now);
    files.write(launch(10));
    files.remove(10);
    files.remove(10);

    assert.deepEqual(fs.readdirSync(directory), []);
  });
});
