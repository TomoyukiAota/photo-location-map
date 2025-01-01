import * as async from 'async';
import { Analytics } from '../../src-shared/analytics/analytics';
import { createPrependedLogger } from '../../src-shared/log/create-prepended-logger';

const logger = createPrependedLogger('[handleRecordAtAppLaunchFinishedWithRetry]');

// References:
// - https://caolan.github.io/async/v3/docs.html#retry
// - https://stackoverflow.com/a/49810502/7947548
export function handleRecordAtAppLaunchFinishedWithRetry() {
  const apiMethod = callback => {
    const handleRecordAtAppLaunchFinished = window?.plmInternalRenderer?.recordAtAppLaunch?.handleRecordAtAppLaunchFinished;

    // Retry in case of window.plmInternalRenderer being undefined since it will eventually be set.
    if (!handleRecordAtAppLaunchFinished) {
      logger.debug(`Retrying apiMethod in handleRecordAtAppLaunchFinishedWithRetry since window.plmInternalRenderer is undefined.`);
      Analytics.trackEvent('handleRecordAtAppLaunchFinishedWithRetry', 'Retrying apiMethod');
      callback(new Error('window.plmInternalRenderer is undefined.'));
      return;
    }

    try {
      handleRecordAtAppLaunchFinished();
    } catch (error) {
      // Cases of errors other than window.plmInternalRenderer being undefined are not retried.
      logger.error(`Error occurred but ignored in handleRecordAtAppLaunchFinishedWithRetry: "${error}"`);
      Analytics.trackEvent('handleRecordAtAppLaunchFinishedWithRetry', 'Error occurred but ignored in apiMethod', error);
    }
    callback(null, true);
  };

  const retryOptions: async.RetryOptions<any> = {
    interval: 100, // 100 ms
    times: 10000,  // (100 ms of interval) * (10000 times) = 16.67 minutes. Something must went wrong if retrying exceeds 16.67 minutes.
  };

  logger.debug(`Calling handleRecordAtAppLaunchFinishedWithRetry with the limit of retrying apiMethod (${retryOptions.times} times with the interval of ${retryOptions.interval} ms).`);
  Analytics.trackEvent('handleRecordAtAppLaunchFinishedWithRetry', 'Calling apiMethod with retry limit', `Retry limit: ${retryOptions.times} times, interval: ${retryOptions.interval} ms`);

  async.retry(retryOptions, apiMethod, error => {
    if (error) {
      logger.error(`Exceeded the limit of retrying apiMethod in handleRecordAtAppLaunchFinishedWithRetry with the error: "${error}"`);
      Analytics.trackEvent('handleRecordAtAppLaunchFinishedWithRetry', 'Exceeded retry limit of apiMethod', error);
    } else {
      logger.debug(`Finished calling handleRecordAtAppLaunchFinishedWithRetry within the limit of retrying apiMethod.`);
      Analytics.trackEvent('handleRecordAtAppLaunchFinishedWithRetry', 'Finished within retry limit of apiMethod');
    }
  });
}
