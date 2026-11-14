import assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { LaunchFiles, LaunchRecord, maxSilenceMs } from '../../../src-main/launch/launch-files.js';

describe('LaunchFiles', () => {
  const now = Date.parse('2026-11-14T00:00:00.000Z');
  const minutesAgo = (minutes: number) => new Date(now - minutes * 60 * 1000).toISOString();
  const launch = (pid: number, lastAliveAt = minutesAgo(1), sessionId = `session-${pid}`): LaunchRecord =>
    ({ pid, sessionId, version: '1.13.0', startedAt: minutesAgo(60 + pid), lastAliveAt });
  const current = { pid: 10, sessionId: 'session-10' };
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

    const ended = files.takeEndedAbnormally(current);

    assert.deepEqual(ended.map(record => record.pid), [40, 30]);  // The oldest first.
    assert.deepEqual(ended[0], launch(40));
    assert.deepEqual(fs.readdirSync(directory).sort(), ['10-session-10.json', '20-session-20.json']);
    assert.deepEqual(files.takeEndedAbnormally(current), []);
  });

  it('should take at most so many launches, the oldest first, and leave the others for a later launch', () => {
    const files = new LaunchFiles(directory, () => false, () => now);
    for (const pid of [20, 30, 40, 50])
      files.write(launch(pid));

    assert.deepEqual(files.takeEndedAbnormally(current, 3).map(record => record.pid), [50, 40, 30]);
    assert.deepEqual(fs.readdirSync(directory), ['20-session-20.json']);
    assert.deepEqual(files.takeEndedAbnormally(current, 3).map(record => record.pid), [20]);
  });

  it('should take a launch whose file was not written for too long as ended, as its process ID may be another\'s', () => {
    const files = new LaunchFiles(directory, () => true, () => now);
    files.write(launch(20, new Date(now - maxSilenceMs - 1).toISOString()));
    files.write(launch(30, minutesAgo(24 * 60)));  // A computer that slept for a day.

    assert.deepEqual(files.takeEndedAbnormally(current).map(record => record.pid), [20]);
  });

  it('should tell a launch whose process ID was given to the current one, as it has ended', () => {
    const files = new LaunchFiles(directory, () => true, () => now);
    files.write(launch(10, minutesAgo(30), 'earlier-session'));
    files.write(launch(10));

    assert.deepEqual(files.takeEndedAbnormally(current), [launch(10, minutesAgo(30), 'earlier-session')]);
    assert.deepEqual(fs.readdirSync(directory), ['10-session-10.json']);
  });

  it('should remove a file that cannot be read, without telling it', () => {
    const files = new LaunchFiles(directory, () => false, () => now);
    fs.writeFileSync(path.join(directory, '50-session-50.json'), 'not JSON');
    fs.writeFileSync(path.join(directory, 'other.txt'), 'kept');

    assert.deepEqual(files.takeEndedAbnormally(current), []);
    assert.deepEqual(fs.readdirSync(directory), ['other.txt']);
  });

  it('should tell nothing when no launch wrote a file yet', () => {
    const files = new LaunchFiles(path.join(directory, 'not-yet'), () => false, () => now);

    assert.deepEqual(files.takeEndedAbnormally(current), []);
  });

  it('should write a file anew through a file beside it, which a launch that ended while writing leaves', () => {
    const files = new LaunchFiles(directory, () => false, () => now);
    files.write(launch(20, minutesAgo(5)));
    files.write(launch(20, minutesAgo(1)));
    assert.deepEqual(fs.readdirSync(directory), ['20-session-20.json']);

    fs.writeFileSync(path.join(directory, '20-session-20.json.tmp'), '{"version":');  // Ended while writing.

    assert.deepEqual(files.takeEndedAbnormally(current), [launch(20, minutesAgo(1))]);
    assert.deepEqual(fs.readdirSync(directory), []);
  });

  it('should give the events that a launch kept, without what is not an event', () => {
    const files = new LaunchFiles(directory, () => false, () => now);
    const keptEvents = [['Unhandled Error (Main)', 'Error: x', 'at f (electron-main.js:1:2)', 'Version: 1'], ['Launch Info', 'Started']] as const;
    files.write({ ...launch(20), keptEvents });
    const file = path.join(directory, '20-session-20.json');
    const written = JSON.parse(fs.readFileSync(file, 'utf8')) as { keptEvents: unknown[] };
    fs.writeFileSync(file, JSON.stringify({ ...written, keptEvents: [...written.keptEvents, 'not an event', [1, 'x'], ['C', 'D', 5], ['E', 'F', 'label', {}]] }));

    assert.deepEqual(files.takeEndedAbnormally(current)[0]?.keptEvents, [
      ['Unhandled Error (Main)', 'Error: x', 'at f (electron-main.js:1:2)', 'Version: 1'],
      ['Launch Info', 'Started', undefined, undefined],
    ]);
  });

  it('should remove its own file', () => {
    const files = new LaunchFiles(directory, () => false, () => now);
    files.write(launch(10));
    files.remove(current);
    files.remove(current);

    assert.deepEqual(fs.readdirSync(directory), []);
  });
});
