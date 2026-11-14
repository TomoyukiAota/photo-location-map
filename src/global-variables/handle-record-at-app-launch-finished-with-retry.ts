import { Analytics } from '../../src-shared/analytics/analytics';
import { createPrependedLogger } from '../../src-shared/log/create-prepended-logger';

const logger = createPrependedLogger('[handleRecordAtAppLaunchFinishedWithRetry]');

// (100 ms of interval) * (1000 times) = 100 seconds of total retry duration.
// Stop retrying after this duration since
// 1) something must have gone wrong so that it's unlikely that continueing to retry will be helpful, and
// 2) retrying too many times messes up the log and analytics.
const retryOptions = {
  interval: 100, // ms
  times: 1000,
};

/** Calls the page's handler, or returns the error that has it called again, while window.plmInternalRenderer is not set. */
function apiMethod(retryCount: number): Error | undefined {
  const handleRecordAtAppLaunchFinished = window?.plmInternalRenderer?.recordAtAppLaunch?.handleRecordAtAppLaunchFinished;

  // Retry in case of window.plmInternalRenderer being undefined since it will eventually be set.
  if (!handleRecordAtAppLaunchFinished) {
    const message = `Retrying apiMethod since window.plmInternalRenderer is undefined. Retry count: ${retryCount}`;
    logger.debug(message);
    Analytics.trackEvent('handleRecordAtAppLaunchFinishedWithRetry', `Retrying apiMethod. Retry count: ${retryCount}`);
    return new Error(message); // Returning an error results in retrying apiMethod.
  }

  try {
    handleRecordAtAppLaunchFinished();
  } catch (error) {
    // Cases of errors other than window.plmInternalRenderer being undefined are not retried.
    logger.errorNotRecorded(`Error occurred but ignored in handleRecordAtAppLaunchFinishedWithRetry: "${error.toString()}"`);
    Analytics.trackEvent('handleRecordAtAppLaunchFinishedWithRetry', 'Error occurred but ignored in apiMethod', error.toString());
  }

  return undefined; // Returning no error results in not retrying apiMethod.
}

/** Calls apiMethod at once, then every retryOptions.interval until it returns no error, at most retryOptions.times times. */
export async function handleRecordAtAppLaunchFinishedWithRetry(): Promise<void> {
  logger.debug(`Calling handleRecordAtAppLaunchFinishedWithRetry with the limit of retrying apiMethod (${retryOptions.times} times with the interval of ${retryOptions.interval} ms).`);
  Analytics.trackEvent('handleRecordAtAppLaunchFinishedWithRetry', 'Calling apiMethod with retry limit', `Retry limit: ${retryOptions.times} times, interval: ${retryOptions.interval} ms`);

  let error = apiMethod(1);
  for (let retryCount = 2; error && retryCount <= retryOptions.times; retryCount++) {
    await new Promise(resolve => setTimeout(resolve, retryOptions.interval));
    error = apiMethod(retryCount);
  }

  if (error) {
    logger.errorNotRecorded(`Exceeded the limit of retrying apiMethod in handleRecordAtAppLaunchFinishedWithRetry with the error: "${error.toString()}"`);
    Analytics.trackEvent('handleRecordAtAppLaunchFinishedWithRetry', 'Exceeded retry limit of apiMethod', error.toString());
  } else {
    logger.debug(`Finished calling handleRecordAtAppLaunchFinishedWithRetry within the limit of retrying apiMethod.`);
    Analytics.trackEvent('handleRecordAtAppLaunchFinishedWithRetry', 'Finished within retry limit of apiMethod');
  }
}
