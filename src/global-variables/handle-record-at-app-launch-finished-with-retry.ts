import * as async from 'async';
import { Analytics } from '../../src-shared/analytics/analytics';
import { createPrependedLogger } from '../../src-shared/log/create-prepended-logger';

const logger = createPrependedLogger('[handleRecordAtAppLaunchFinishedWithRetry]');

// References:
// - https://caolan.github.io/async/v3/docs.html#retry
// - https://stackoverflow.com/a/49810502/7947548
export function handleRecordAtAppLaunchFinishedWithRetry() {
  let retryCount = 0;

  const apiMethod = callback => {
    retryCount++;
    const handleRecordAtAppLaunchFinished = window?.plmInternalRenderer?.recordAtAppLaunch?.handleRecordAtAppLaunchFinished;

    // Retry in case of window.plmInternalRenderer being undefined since it will eventually be set.
    if (!handleRecordAtAppLaunchFinished) {
      const message = `Retrying apiMethod since window.plmInternalRenderer is undefined. Retry count: ${retryCount}`;
      logger.debug(message);
      Analytics.trackEvent('handleRecordAtAppLaunchFinishedWithRetry', `Retrying apiMethod. Retry count: ${retryCount}`);
      callback(new Error(message)); // Passing an error to callback results in retrying apiMethod.
      return;
    }

    try {
      handleRecordAtAppLaunchFinished();
    } catch (error) {
      // Cases of errors other than window.plmInternalRenderer being undefined are not retried.
      logger.error(`Error occurred but ignored in handleRecordAtAppLaunchFinishedWithRetry: "${error.toString()}"`);
      Analytics.trackEvent('handleRecordAtAppLaunchFinishedWithRetry', 'Error occurred but ignored in apiMethod', error.toString());
    }

    callback(null, true); // Passing null as the first argument to callback results in not retrying apiMethod.
  };

  // (100 ms of interval) * (1000 times) = 100 seconds of total retry duration.
  // Stop retrying after this duration since
  // 1) something must have gone wrong so that it's unlikely that continueing to retry will be helpful, and
  // 2) retrying too many times messes up the log and analytics.
  const retryOptions: async.RetryOptions<any> = {
    interval: 100, // ms
    times: 1000,
  };

  logger.debug(`Calling handleRecordAtAppLaunchFinishedWithRetry with the limit of retrying apiMethod (${retryOptions.times} times with the interval of ${retryOptions.interval} ms).`);
  Analytics.trackEvent('handleRecordAtAppLaunchFinishedWithRetry', 'Calling apiMethod with retry limit', `Retry limit: ${retryOptions.times} times, interval: ${retryOptions.interval} ms`);

  async.retry(retryOptions, apiMethod, error => {
    if (error) {
      logger.error(`Exceeded the limit of retrying apiMethod in handleRecordAtAppLaunchFinishedWithRetry with the error: "${error.toString()}"`);
      Analytics.trackEvent('handleRecordAtAppLaunchFinishedWithRetry', 'Exceeded retry limit of apiMethod', error.toString());
    } else {
      logger.debug(`Finished calling handleRecordAtAppLaunchFinishedWithRetry within the limit of retrying apiMethod.`);
      Analytics.trackEvent('handleRecordAtAppLaunchFinishedWithRetry', 'Finished within retry limit of apiMethod');
    }
  });
}
