import * as os from 'os';
import { app } from 'electron';
import * as moment from 'moment-timezone';
import { Analytics } from '../src-shared/analytics/analytics';
import { Logger } from '../src-shared/log/logger';
import { getDevOrProd } from '../src-shared/dev-or-prod/dev-or-prod';
import { UserDataStorage } from '../src-shared/user-data-storage/user-data-storage';
import { UserDataStoragePath } from '../src-shared/user-data-storage/user-data-stroage-path';
import { Now } from '../src-shared/date-time/now';

const now = Now.extendedFormat;

const recordAppLaunch = () => {
  Analytics.trackEvent('App Launch', `App Launch`, `Launched at ${now}`);
  Logger.info(`Application is launched at ${now}`);
};

const recordLastLaunchDateTime = () => {
  let lastLaunchDateTime: string;

  try {
    lastLaunchDateTime = UserDataStorage.read(UserDataStoragePath.History.LastLaunchDateTime);
  } catch {
    lastLaunchDateTime = '"This is the first launch."';
  }

  Analytics.trackEvent('Launch Info', `Launch Info: Last Launch Date`, `Last Launch Date: ${lastLaunchDateTime}`);
  Logger.info(`Last Launch Date: ${lastLaunchDateTime}`);
  UserDataStorage.write(UserDataStoragePath.History.LastLaunchDateTime, now);
};

const recordFirstLaunchDateTimeAndPeriodOfUse = () => {
  let firstLaunchDateTime: string;

  try {
    firstLaunchDateTime = UserDataStorage.read(UserDataStoragePath.History.FirstLaunchDateTime);
  } catch {
    firstLaunchDateTime = now;
    UserDataStorage.write(UserDataStoragePath.History.FirstLaunchDateTime, firstLaunchDateTime);
  }

  Analytics.trackEvent('Launch Info', `Launch Info: First Launch Date`, `First Launch Date: ${firstLaunchDateTime}`);
  Logger.info(`First Launch Date: ${firstLaunchDateTime}`);

  const duration = moment.duration(moment(now).diff(moment(firstLaunchDateTime)));
  const durationStr = duration.toISOString();
  Analytics.trackEvent('Launch Info', `Launch Info: Period of Use`, `Period of Use: ${durationStr}`);
  Logger.info(`Period of Use: ${durationStr}`);
};

const recordLaunchCount = () => {
  let previousLaunchCount: number;

  try {
    const previousLaunchCountStr = UserDataStorage.read(UserDataStoragePath.History.LaunchCount);
    previousLaunchCount = Number(previousLaunchCountStr);
  } catch {
    previousLaunchCount = 0;
  }

  const launchCount = previousLaunchCount + 1;
  Analytics.trackEvent('Launch Info', `Launch Info: Launch Count`, `Launch Count: ${launchCount}`);
  Logger.info(`Launch Count: ${launchCount}`);
  UserDataStorage.write(UserDataStoragePath.History.LaunchCount, launchCount.toString());
};

export const recordAtAppLaunch = () => {
  recordAppLaunch();
  recordLastLaunchDateTime();
  recordFirstLaunchDateTimeAndPeriodOfUse();
  recordLaunchCount();

  Analytics.trackEvent('App Ver', `App Ver: ${app.getVersion()}`);
  Logger.info(`Application Version: ${app.getVersion()}`);

  Analytics.trackEvent('DevOrProd', `DevOrProd: ${getDevOrProd()}`);

  Analytics.trackEvent('OS Info', `OS: ${os.platform()}`, `OS Ver: ${os.release()}`);
  Logger.info(`OS: ${os.platform()}; OS Ver: ${os.release()}`);
};
