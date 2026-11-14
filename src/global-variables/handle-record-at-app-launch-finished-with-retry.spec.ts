import { Analytics } from '../../src-shared/analytics/analytics';
import { handleRecordAtAppLaunchFinishedWithRetry } from './handle-record-at-app-launch-finished-with-retry';

describe('handleRecordAtAppLaunchFinishedWithRetry', () => {
  const category = 'handleRecordAtAppLaunchFinishedWithRetry';
  let trackEvent: ReturnType<typeof vi.spyOn>;
  const actions = () => trackEvent.mock.calls.map(call => call[1]);

  /** What the page does once it has started (PlmInternalRendererService.initialize). */
  function setHandler(handler: () => void): void {
    window.plmInternalRenderer = { recordAtAppLaunch: { handleRecordAtAppLaunchFinished: handler } } as IPlmInternalRenderer;
  }

  beforeEach(() => {
    vi.useFakeTimers();
    trackEvent = vi.spyOn(Analytics, 'trackEvent');
    window.plmInternalRenderer = undefined;
  });

  afterEach(() => {
    window.plmInternalRenderer = undefined;
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('calls the handler at once when the page has set it', async () => {
    const handler = vi.fn();
    setHandler(handler);

    await handleRecordAtAppLaunchFinishedWithRetry();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(actions()).toEqual(['Calling apiMethod with retry limit', 'Finished within retry limit of apiMethod']);
  });

  it('tries again every 100 ms until the page sets the handler', async () => {
    const handler = vi.fn();
    const finished = handleRecordAtAppLaunchFinishedWithRetry();
    await vi.advanceTimersByTimeAsync(200);
    expect(actions()).toHaveLength(1 + 3);

    setHandler(handler);
    await vi.advanceTimersByTimeAsync(100);
    await finished;

    expect(handler).toHaveBeenCalledTimes(1);
    expect(actions()).toEqual([
      'Calling apiMethod with retry limit',
      'Retrying apiMethod. Retry count: 1',
      'Retrying apiMethod. Retry count: 2',
      'Retrying apiMethod. Retry count: 3',
      'Finished within retry limit of apiMethod',
    ]);
  });

  it('does not call again a handler that throws', async () => {
    const handler = vi.fn(() => { throw new Error('The handler failed'); });
    setHandler(handler);

    await handleRecordAtAppLaunchFinishedWithRetry();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith(category, 'Error occurred but ignored in apiMethod', 'Error: The handler failed');
    expect(actions().at(-1)).toBe('Finished within retry limit of apiMethod');
  });

  it('stops after 1000 tries, 100 seconds after the first', async () => {
    const finished = handleRecordAtAppLaunchFinishedWithRetry();
    await vi.advanceTimersByTimeAsync(99_900);
    await finished;

    expect(actions()).toHaveLength(1 + 1000 + 1);
    expect(actions().at(-2)).toBe('Retrying apiMethod. Retry count: 1000');
    expect(trackEvent).toHaveBeenLastCalledWith(category, 'Exceeded retry limit of apiMethod',
      'Error: Retrying apiMethod since window.plmInternalRenderer is undefined. Retry count: 1000');
    expect(vi.getTimerCount()).toBe(0);
  });
});
