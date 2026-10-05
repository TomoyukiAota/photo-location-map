import { AnalyticsBackendEvent } from './analytics-backend-event';

export interface AnalyticsBackendSenderOptions {
  /** Sends one batch. Resolves with the HTTP status; rejects when the request fails (e.g. offline). */
  post: (events: AnalyticsBackendEvent[]) => Promise<number>;
  setTimer: (callback: () => void, delayMs: number) => unknown;
  clearTimer: (timer: unknown) => void;
  logger: { info: (message: string) => void, warn: (message: string) => void };
}

// Decides when to send events to the analytics backend:
//  - 1 second after the first unsent event, with everything queued by then. The events of an app launch are
//    produced within a fraction of a second, so they go in one request.
//  - At once when a full batch (500 events, the most the backend takes in one request) is queued.
//  - After a network error, 429 or 5xx, the batch is retried with exponential backoff from 5 seconds up to
//    5 minutes, so that an offline machine does not retry every second.
//  - Any other 4xx would fail again, so that batch is dropped.
// Timers and the request itself are passed in, so that this logic can be unit-tested.
export class AnalyticsBackendSender {
  public static readonly sendDelayMs = 1_000;
  public static readonly maxBatchSize = 500;
  public static readonly maxQueueSize = 5_000;   // Keeps memory bounded while offline; the oldest events are dropped.
  public static readonly initialRetryDelayMs = 5_000;
  public static readonly maxRetryDelayMs = 300_000;

  private queue: AnalyticsBackendEvent[] = [];
  private inFlight: AnalyticsBackendEvent[] = [];
  private timer: unknown = undefined;
  private retryDelayMs = 0;  // 0 unless the last attempt failed and a retry is scheduled.

  constructor(private readonly options: AnalyticsBackendSenderOptions) {
  }

  public add(...events: AnalyticsBackendEvent[]): void {
    this.queue.push(...events);
    const excess = this.queue.length - AnalyticsBackendSender.maxQueueSize;
    if (excess > 0) {
      this.queue.splice(0, excess);
      this.options.logger.warn(`The queue is full. Dropped the oldest ${excess} events.`);
    }
    this.scheduleSend();
  }

  /** Everything not sent yet, oldest first, including a batch whose request has not finished. Saved on quit. */
  public get unsentEvents(): AnalyticsBackendEvent[] {
    return [...this.inFlight, ...this.queue];
  }

  private scheduleSend(): void {
    // While a request is in flight, send() schedules the next one when it finishes.
    // While backing off, the retry timer sends.
    if (this.inFlight.length > 0 || this.retryDelayMs > 0 || this.queue.length === 0)
      return;

    if (this.queue.length >= AnalyticsBackendSender.maxBatchSize) {
      this.cancelTimer();
      void this.send();
      return;
    }

    if (this.timer === undefined)
      this.startTimer(AnalyticsBackendSender.sendDelayMs);
  }

  private startTimer(delayMs: number): void {
    this.timer = this.options.setTimer(() => {
      this.timer = undefined;
      void this.send();
    }, delayMs);
  }

  private cancelTimer(): void {
    if (this.timer !== undefined) {
      this.options.clearTimer(this.timer);
      this.timer = undefined;
    }
  }

  private async send(): Promise<void> {
    if (this.inFlight.length > 0 || this.queue.length === 0)
      return;

    const batch = this.queue.splice(0, AnalyticsBackendSender.maxBatchSize);
    this.inFlight = batch;
    let retry: boolean;
    try {
      const status = await this.options.post(batch);
      if (status >= 200 && status < 300) {
        retry = false;
      } else if (status === 429 || status >= 500) {
        retry = true;
        this.options.logger.warn(`Sending ${batch.length} events failed with ${status}.`);
      } else {
        retry = false;
        this.options.logger.warn(`Sending ${batch.length} events failed with ${status}. Dropped them, as they would fail again.`);
      }
    } catch (error) {
      retry = true;
      this.options.logger.warn(`Sending ${batch.length} events failed: ${error}`);
    }
    this.inFlight = [];

    if (retry) {
      this.queue.unshift(...batch);
      this.retryDelayMs = this.retryDelayMs === 0
        ? AnalyticsBackendSender.initialRetryDelayMs
        : Math.min(this.retryDelayMs * 2, AnalyticsBackendSender.maxRetryDelayMs);
      this.options.logger.warn(`Retrying in ${this.retryDelayMs / 1000} seconds.`);
      this.cancelTimer();
      this.startTimer(this.retryDelayMs);
      return;
    }

    this.retryDelayMs = 0;
    this.scheduleSend();  // Events added while the request was in flight, or beyond one batch.
  }
}
