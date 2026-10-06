// power-assert's parser in this test setup does not accept newer syntax such as `??` or `1_000`.
import assert = require('assert');
import { AnalyticsBackendEvent } from '../../../src-shared/analytics/analytics-backend/analytics-backend-event';
import { AnalyticsBackendSender } from '../../../src-shared/analytics/analytics-backend/analytics-backend-sender';

// Timers that run only when the test advances the clock.
class FakeTimers {
  private now = 0;
  private nextId = 1;
  private timers: { id: number, at: number, callback: () => void }[] = [];

  public setTimer = (callback: () => void, delayMs: number): unknown => {
    const id = this.nextId++;
    this.timers.push({ id, at: this.now + delayMs, callback });
    return id;
  };

  public clearTimer = (timer: unknown): void => {
    this.timers = this.timers.filter(t => t.id !== timer);
  };

  /** Delays of the pending timers from now, in ms. */
  public get pendingDelays(): number[] {
    return this.timers.map(t => t.at - this.now);
  }

  public async advance(ms: number): Promise<void> {
    const end = this.now + ms;
    for (;;) {
      const due = this.timers.filter(t => t.at <= end).sort((a, b) => a.at - b.at)[0];
      if (!due)
        break;
      this.now = due.at;
      this.timers = this.timers.filter(t => t !== due);
      due.callback();
      await settle();
    }
    this.now = end;
  }
}

// Lets pending promise callbacks (the fake request) run.
const settle = () => new Promise(resolve => setImmediate(resolve));

// A request that answers with the given statuses in turn (an Error means a failed request), then 200.
class FakeBackend {
  public readonly batches: string[][] = [];

  constructor(private readonly responses: (number | Error)[] = []) {
  }

  public post = async (events: AnalyticsBackendEvent[]): Promise<number> => {
    this.batches.push(events.map(e => e.event_id));
    const response = this.responses.length > 0 ? this.responses.shift() : 200;
    if (response instanceof Error)
      throw response;
    return response;
  };
}

const silentLogger = { info: () => {}, warn: () => {} };

let eventCount = 0;
function events(count: number, label: string = null): AnalyticsBackendEvent[] {
  return Array.from({ length: count }, () => {
    const id = `e${eventCount++}`;
    return {
      event_id: id, user_id: 'u', session_id: 's', seq: 0, client_ts: '2026-10-06T00:00:00.000Z',
      app_version: '0.0.0', os: 'darwin', os_release: '0', category: 'Test', action: id, label, value: null,
    };
  });
}

function jsonBytes(batch: string[], all: AnalyticsBackendEvent[]): number {
  const ids = new Set(batch);
  return Buffer.byteLength(JSON.stringify(all.filter(e => ids.has(e.event_id))));
}

function createSender(backend: FakeBackend, timers: FakeTimers): AnalyticsBackendSender {
  return new AnalyticsBackendSender({
    post: backend.post, setTimer: timers.setTimer, clearTimer: timers.clearTimer, logger: silentLogger,
  });
}

describe('AnalyticsBackendSender', () => {
  it('sends 1 second after the first event, with everything added by then, in one request', async () => {
    const backend = new FakeBackend();
    const timers = new FakeTimers();
    const sender = createSender(backend, timers);

    const first = events(1);
    sender.add(...first);
    await timers.advance(500);
    const second = events(2);
    sender.add(...second);
    assert.deepEqual(backend.batches, []);
    assert.deepEqual(timers.pendingDelays, [500]);  // The later events do not push the send back.

    await timers.advance(500);
    assert.deepEqual(backend.batches, [[...first, ...second].map(e => e.event_id)]);
    assert.deepEqual(sender.unsentEvents, []);
  });

  it('sends at once when a full batch is queued, and the rest right after it', async () => {
    const backend = new FakeBackend();
    const timers = new FakeTimers();
    const sender = createSender(backend, timers);

    const all = events(AnalyticsBackendSender.maxBatchSize + 1);
    sender.add(...all);
    await settle();
    await settle();
    assert.equal(backend.batches.length, 2);
    assert.equal(backend.batches[0].length, AnalyticsBackendSender.maxBatchSize);
    assert.deepEqual(backend.batches[1], [all[AnalyticsBackendSender.maxBatchSize].event_id]);
    assert.deepEqual(timers.pendingDelays, []);
  });

  it('keeps a batch under 200 KiB, as the backend refuses a request over 256 KiB, and sends the rest right after it', async () => {
    const backend = new FakeBackend();
    const timers = new FakeTimers();
    const sender = createSender(backend, timers);

    // Like a backlog after some time offline: launches each send a label of about 3.5 KB.
    const all = events(150, 'x'.repeat(3500));
    sender.add(...all);
    for (let i = 0; i < 5; i++) {
      await timers.advance(1000);
      await settle();
    }

    assert.ok(backend.batches.length >= 3);
    assert.ok(backend.batches.every(b => jsonBytes(b, all) <= AnalyticsBackendSender.maxBatchBytes));
    assert.deepEqual([].concat(...backend.batches), all.map(e => e.event_id));
    assert.deepEqual(timers.pendingDelays, []);
  });

  it('counts the size in UTF-8 bytes', async () => {
    const backend = new FakeBackend();
    const timers = new FakeTimers();
    const sender = createSender(backend, timers);

    // 3 bytes a character: 60 events are about 3 x 200 KiB in UTF-8, though only about 200 KiB in characters.
    const all = events(60, 'あ'.repeat(10000));
    sender.add(...all);
    for (let i = 0; i < 5; i++) {
      await timers.advance(1000);
      await settle();
    }

    assert.ok(backend.batches.length >= 3);
    assert.ok(backend.batches.every(b => jsonBytes(b, all) <= AnalyticsBackendSender.maxBatchBytes));
  });

  it('sends an event larger than a batch on its own', async () => {
    const backend = new FakeBackend();
    const timers = new FakeTimers();
    const sender = createSender(backend, timers);

    const all = [...events(1), ...events(1, 'x'.repeat(AnalyticsBackendSender.maxBatchBytes)), ...events(1)];
    sender.add(...all);
    for (let i = 0; i < 3; i++) {
      await timers.advance(1000);
      await settle();
    }

    assert.deepEqual(backend.batches, all.map(e => [e.event_id]));
  });

  it('sends events added during a request in the next one', async () => {
    let finishFirstRequest: (status: number) => void = () => {};
    const batches: string[][] = [];
    const timers = new FakeTimers();
    const sender = new AnalyticsBackendSender({
      post: async (batch) => {
        batches.push(batch.map(e => e.event_id));
        return batches.length === 1 ? new Promise<number>(resolve => finishFirstRequest = resolve) : 200;
      },
      setTimer: timers.setTimer, clearTimer: timers.clearTimer, logger: silentLogger,
    });

    const first = events(1);
    sender.add(...first);
    await timers.advance(1000);
    const second = events(1);
    sender.add(...second);
    assert.deepEqual(sender.unsentEvents.map(e => e.event_id), [...first, ...second].map(e => e.event_id));

    finishFirstRequest(200);
    await settle();
    await timers.advance(1000);
    assert.deepEqual(batches, [[first[0].event_id], [second[0].event_id]]);
  });

  for (const failure of [new Error('net::ERR_INTERNET_DISCONNECTED'), 429, 500, 503]) {
    it(`retries after ${failure instanceof Error ? 'a failed request' : failure}, backing off from 5 seconds up to 5 minutes`, async () => {
      const backend = new FakeBackend(Array(8).fill(failure));
      const timers = new FakeTimers();
      const sender = createSender(backend, timers);

      const batch = events(3);
      sender.add(...batch);
      await timers.advance(1000);
      const delays: number[] = [];
      for (let attempt = 0; attempt < 8; attempt++) {
        delays.push(timers.pendingDelays[0]);
        await timers.advance(timers.pendingDelays[0]);
      }

      assert.deepEqual(delays, [5000, 10000, 20000, 40000, 80000, 160000, 300000, 300000]);
      assert.equal(backend.batches.length, 9);  // The 9th attempt succeeded.
      assert.ok(backend.batches.every(b => b.join() === batch.map(e => e.event_id).join()));
      assert.deepEqual(sender.unsentEvents, []);
    });
  }

  it('does not send new events while backing off, and starts from 5 seconds again after a success', async () => {
    const backend = new FakeBackend([503, 200, 503]);
    const timers = new FakeTimers();
    const sender = createSender(backend, timers);

    sender.add(...events(1));
    await timers.advance(1000);  // 503
    sender.add(...events(AnalyticsBackendSender.maxBatchSize));
    await settle();
    assert.equal(backend.batches.length, 1);  // A full batch waits for the retry too.

    await timers.advance(5000);  // 200 for the first 500, then the last one right after it gets 503.
    await settle();
    assert.equal(backend.batches.length, 3);
    assert.deepEqual(timers.pendingDelays, [5000]);
  });

  it('drops a batch rejected with a 4xx other than 429, and goes on', async () => {
    const backend = new FakeBackend([400]);
    const timers = new FakeTimers();
    const sender = createSender(backend, timers);

    sender.add(...events(2));
    await timers.advance(1000);
    assert.deepEqual(sender.unsentEvents, []);
    assert.deepEqual(timers.pendingDelays, []);

    const next = events(1);
    sender.add(...next);
    await timers.advance(1000);
    assert.deepEqual(backend.batches[1], [next[0].event_id]);
  });

  it('keeps at most 5,000 events, dropping the oldest', async () => {
    const backend = new FakeBackend([new Error('offline')]);
    const timers = new FakeTimers();
    const sender = createSender(backend, timers);

    sender.add(...events(1));
    await timers.advance(1000);  // Fails; now backing off.
    const many = events(AnalyticsBackendSender.maxQueueSize);
    sender.add(...many);

    assert.deepEqual(sender.unsentEvents.map(e => e.event_id), many.map(e => e.event_id));
  });
});
