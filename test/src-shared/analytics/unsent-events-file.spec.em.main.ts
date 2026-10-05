import assert = require('assert');
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { AnalyticsBackendEvent } from '../../../src-shared/analytics/analytics-backend/analytics-backend-event';
import { UnsentEventsFile } from '../../../src-shared/analytics/analytics-backend/unsent-events-file';

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
