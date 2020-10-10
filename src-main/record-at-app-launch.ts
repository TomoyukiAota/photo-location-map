import * as os from 'os';
import { app } from 'electron';
import * as moment from 'moment-timezone';
import { Analytics } from '../src-shared/analytics/analytics';
import { DateTimeFormat } from '../src-shared/date-time/date-time-format';
import { Now } from '../src-shared/date-time/now';
import { DevOrProd } from '../src-shared/dev-or-prod/dev-or-prod';
import { Logger } from '../src-shared/log/logger';
import { UserDataStorage } from '../src-shared/user-data-storage/user-data-storage';
import { UserDataStoragePath } from '../src-shared/user-data-storage/user-data-stroage-path';
import { loadedUserSettings } from '../src-shared/user-settings/user-settings';

const isNaturalNumber = require('is-natural-number');

const now = Now.extendedFormat;

const recordAppLaunch = () => {
  Analytics.trackEvent('App Launch', `App Launch`, `Launched at ${now}`);
  Logger.info(`Application is launched at ${now}`);
};

const recordLastLaunchDateTime = () => {
  const lastLaunchDateTime = UserDataStorage.readOrDefault(
    UserDataStoragePath.History.LastLaunchDateTime,
    '"This is the first launch."');

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
  const prevLaunchCountStr = UserDataStorage.readOrDefault(
    UserDataStoragePath.History.LaunchCount,
    '0');
  const maybePrevLaunchCount = Number(prevLaunchCountStr);
  const prevLaunchCount = isNaturalNumber(maybePrevLaunchCount, {includeZero: true}) ? maybePrevLaunchCount : 0;
  const launchCount = prevLaunchCount + 1;
  Analytics.trackEvent('Launch Info', `Launch Info: Launch Count`, `Launch Count: ${launchCount}`);
  Logger.info(`Launch Count: ${launchCount}`);
  UserDataStorage.write(UserDataStoragePath.History.LaunchCount, launchCount.toString());
};

const recordLoadedUserSettings = () => {
  const settings = loadedUserSettings;
  const momentJsFormatString = DateTimeFormat.ForUser.getMomentJsFormatString(settings.dateFormat, settings.clockSystemFormat);
  Analytics.trackEvent('Loaded User Settings', `Date Format: ${settings.dateFormat}`);
  Analytics.trackEvent('Loaded User Settings', `Clock System Format: ${settings.clockSystemFormat}`);
  Analytics.trackEvent('Loaded User Settings', `moment.js format: ${momentJsFormatString}`);
};

export const recordAtAppLaunch = () => {
  recordAppLaunch();
  recordLastLaunchDateTime();
  recordFirstLaunchDateTimeAndPeriodOfUse();
  recordLaunchCount();

  Analytics.trackEvent('App Ver', `App Ver: ${app.getVersion()}`);
  Logger.info(`Application Version: ${app.getVersion()}`);

  Analytics.trackEvent('DevOrProd', `DevOrProd: ${DevOrProd.toString()}`);

  Analytics.trackEvent('OS Info', `OS: ${os.platform()}`, `OS Ver: ${os.release()}`);
  Logger.info(`OS: ${os.platform()}; OS Ver: ${os.release()}`);

  recordLoadedUserSettings();
};
