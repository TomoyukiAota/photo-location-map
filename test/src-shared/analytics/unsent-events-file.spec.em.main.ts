import assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { AnalyticsBackendEvent } from '../../../src-shared/analytics/analytics-backend/analytics-backend-event.js';
import { UnsentEventsFile, UnsentEventsFiles, maxUnwrittenMs } from '../../../src-shared/analytics/analytics-backend/unsent-events-file.js';

const event = (id: string): AnalyticsBackendEvent => ({
  event_id: id, user_id: 'u', session_id: 's', seq: 0, client_ts: '2026-10-06T00:00:00.000Z',
  app_version: '0.0.0', os: 'darwin', os_release: '0', category: 'Test', action: 'Test', label: null, value: 1,
});

describe('UnsentEventsFile', () => {
  let directory: string;
  let filePath: string;

  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'unsent-events-file-'));
    filePath = path.join(directory, 'unsent.json');
  });

  afterEach(() => {
    fs.rmSync(directory, { recursive: true, force: true });
  });

  it('should give back the saved events once', () => {
    const file = new UnsentEventsFile(filePath);
    file.save([event('a'), event('b')]);

    assert.deepEqual(file.loadAndRemove().map(e => e.event_id), ['a', 'b']);
    assert.equal(fs.existsSync(filePath), false);
    assert.deepEqual(file.loadAndRemove(), []);
  });

  it('should write the file anew through a file beside it, and keep the events it held when writing fails', () => {
    const file = new UnsentEventsFile(filePath);
    file.save([event('a')]);
    file.save([event('b')]);
    assert.deepEqual(fs.readdirSync(directory), ['unsent.json']);

    fs.mkdirSync(`${filePath}.tmp`);  // Cannot be written as a file.
    assert.throws(() => file.save([event('c')]));

    assert.deepEqual(file.load().map(e => e.event_id), ['b']);
  });

  it('should remove the file when saving no events', () => {
    const file = new UnsentEventsFile(filePath);
    file.save([event('a')]);
    file.save([]);

    assert.equal(fs.existsSync(filePath), false);
  });

  it('should give no events and remove a file that is not JSON', () => {
    fs.writeFileSync(filePath, '[{"event_id": "a"');

    assert.deepEqual(new UnsentEventsFile(filePath).loadAndRemove(), []);
    assert.equal(fs.existsSync(filePath), false);
  });

  it('should skip what is not an event', () => {
    fs.writeFileSync(filePath, JSON.stringify([event('a'), null, 3, { event_id: 7 }, event('b')]));

    assert.deepEqual(new UnsentEventsFile(filePath).loadAndRemove().map(e => e.event_id), ['a', 'b']);
  });

  it('should give no events for JSON that is not an array', () => {
    fs.writeFileSync(filePath, JSON.stringify({ event_id: 'a' }));

    assert.deepEqual(new UnsentEventsFile(filePath).loadAndRemove(), []);
  });
});

describe('UnsentEventsFiles', () => {
  let directory: string;
  const now = Date.now();

  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'unsent-events-files-'));
  });

  afterEach(() => {
    fs.rmSync(directory, { recursive: true, force: true });
  });

  const write = (name: string, ids: string[], modifiedAt = now) => {
    const filePath = path.join(directory, name);
    fs.writeFileSync(filePath, JSON.stringify(ids.map(event)));
    fs.utimesSync(filePath, modifiedAt / 1000, modifiedAt / 1000);
  };

  it("should name each launch's own file by its process ID and endpoint", () => {
    const files = new UnsentEventsFiles(directory, 'prod', () => true, () => now);

    assert.equal(path.basename(files.own(123).filePath), 'analytics-backend-unsent-events-prod-123.json');
  });

  it('should take over the files of launches that ended, and the one file of earlier versions, but not of running ones', () => {
    const running = new Set([1, 2]);
    write('analytics-backend-unsent-events-prod.json', ['old']);
    write('analytics-backend-unsent-events-prod-1.json', ['mine']);
    write('analytics-backend-unsent-events-prod-2.json', ['running']);
    write('analytics-backend-unsent-events-prod-3.json', ['ended']);
    write('analytics-backend-unsent-events-prod-4.json', ['long ago'], now - maxUnwrittenMs - 1000);
    write('analytics-backend-unsent-events-dev-5.json', ['dev']);
    running.add(4);  // Its process ID belongs to another process now.

    const files = new UnsentEventsFiles(directory, 'prod', pid => running.has(pid), () => now);
    const ids = files.left(1).flatMap(file => file.load().map(e => e.event_id)).sort();

    assert.deepEqual(ids, ['ended', 'long ago', 'old']);
  });

  it('should take over its own file, which a launch that was given the same process ID left, with those of ended launches', () => {
    write('analytics-backend-unsent-events-prod-1.json', ['earlier']);
    write('analytics-backend-unsent-events-prod-2.json', ['running']);
    write('analytics-backend-unsent-events-prod-3.json', ['ended']);
    const warnings: string[] = [];
    const files = new UnsentEventsFiles(directory, 'prod', pid => pid === 2, () => now);

    const ids = files.takeOver(1, message => warnings.push(message)).map(e => e.event_id).sort();

    assert.deepEqual(ids, ['earlier', 'ended']);
    assert.deepEqual(files.own(1).load().map(e => e.event_id).sort(), ['earlier', 'ended']);
    assert.deepEqual(fs.readdirSync(directory).sort(), ['analytics-backend-unsent-events-prod-1.json', 'analytics-backend-unsent-events-prod-2.json']);
    assert.deepEqual(warnings, []);
  });

  it('should give the events taken over when a file cannot be removed, which a later launch takes over again', () => {
    write('analytics-backend-unsent-events-prod-3.json', ['ended']);
    fs.mkdirSync(path.join(directory, 'analytics-backend-unsent-events-prod-4.json'));  // Cannot be removed as a file.
    const warnings: string[] = [];
    const files = new UnsentEventsFiles(directory, 'prod', () => false, () => now);

    const ids = files.takeOver(1, message => warnings.push(message)).map(e => e.event_id);

    assert.deepEqual(ids, ['ended']);
    assert.deepEqual(files.own(1).load().map(e => e.event_id), ['ended']);
    assert.equal(warnings.length, 1);
    assert.ok(fs.existsSync(path.join(directory, 'analytics-backend-unsent-events-prod-4.json')));
  });

  it('should load a file without removing it, until it is removed', () => {
    const file = new UnsentEventsFiles(directory, 'dev', () => false, () => now).own(7);
    file.save([event('a')]);

    assert.deepEqual(file.load().map(e => e.event_id), ['a']);
    assert.deepEqual(file.load().map(e => e.event_id), ['a']);
    file.remove();
    assert.deepEqual(file.load(), []);
    file.remove();
  });
});
