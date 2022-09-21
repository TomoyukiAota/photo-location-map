import * as os from 'os';
import { app, screen } from 'electron';
import { Analytics } from '../src-shared/analytics/analytics';
import { DateTimeFormat } from '../src-shared/date-time/date-time-format';
import { Now } from '../src-shared/date-time/now';
import { DevOrProd } from '../src-shared/dev-or-prod/dev-or-prod';
import { Logger } from '../src-shared/log/logger';
import { UserDataStorage } from '../src-shared/user-data-storage/user-data-storage';
import { UserDataStoragePath } from '../src-shared/user-data-storage/user-data-stroage-path';
import { currentUserSettings } from '../src-shared/user-settings/user-settings';
import { LaunchInfo } from './launch-info';
import { recordWindowState } from './window-config';

const now = Now.extendedFormat;

const recordAppLaunch = () => {
  Analytics.trackEvent('App Launch', `App Launch`, `Launched at ${now}`);
  Logger.info(`Application is launched at ${now}`);
};

const recordLastLaunchDateTime = () => {
  const lastLaunchDateTime = LaunchInfo.lastLaunchDateTime;
  Analytics.trackEvent('Launch Info', `Launch Info: Last Launch Date`, `Last Launch Date: ${lastLaunchDateTime}`);
  Logger.info(`Last Launch Date: ${lastLaunchDateTime}`);
};

const recordFirstLaunchDateTime = () => {
  const firstLaunchDateTime = LaunchInfo.firstLaunchDateTime;
  Analytics.trackEvent('Launch Info', `Launch Info: First Launch Date`, `First Launch Date: ${firstLaunchDateTime}`);
  Logger.info(`First Launch Date: ${firstLaunchDateTime}`);
};

const recordPeriodOfUse = () => {
  const periodOfUse = LaunchInfo.periodOfUse;
  Analytics.trackEvent('Launch Info', `Launch Info: Period of Use`, `Period of Use: ${periodOfUse}`);
  Logger.info(`Period of Use: ${periodOfUse}`);
};

const recordLaunchCount = () => {
  const launchCount = LaunchInfo.launchCount;
  Analytics.trackEvent('Launch Info', `Launch Info: Launch Count`, `Launch Count: ${launchCount}`);
  Logger.info(`Launch Count: ${launchCount}`);
};

const recordAppVer = () => {
  Analytics.trackEvent('App Ver', `App Ver: ${app.getVersion()}`);
  Logger.info(`Application Version: ${app.getVersion()}`);
};

const recordDevOrProd = () => {
  Analytics.trackEvent('DevOrProd', `DevOrProd: ${DevOrProd.toString()}`);
  Logger.info(`DevOrProd: ${DevOrProd.toString()}`);
};

const recordOs = () => {
  Analytics.trackEvent('OS Info', `OS: ${os.platform()}`, `OS Ver: ${os.release()}`);
  Logger.info(`OS: ${os.platform()}; OS Ver: ${os.release()}`);
};

const recordDisplays = () => {
  const allDisplays = screen.getAllDisplays();
  Analytics.trackEvent('Display Info', `[Display Info] Number of displays: ${allDisplays.length}`);
  Logger.info(`[Display Info] Number of displays: ${allDisplays.length}`);
  allDisplays.forEach((display, index) => {
    Analytics.trackEvent('Display Info', `[Display Info] All Displays`, `Width: ${display.size.width}, Height: ${display.size.height}`);
    Analytics.trackEvent('Display Info', `[Display Info] Display ${index + 1}`, `Width: ${display.size.width}, Height: ${display.size.height}`);
    Logger.info(`[Display Info] Display ${index + 1}, Width: ${display.size.width}, Height: ${display.size.height}`);
  });
};

const recordLoadedUserSettings = () => {
  const settings = currentUserSettings;
  const momentJsFormatString = DateTimeFormat.ForUser.getMomentJsFormatString(settings.dateFormat, settings.clockSystemFormat);
  Analytics.trackEvent('Loaded User Settings', `Date Format: ${settings.dateFormat}`);
  Analytics.trackEvent('Loaded User Settings', `Clock System Format: ${settings.clockSystemFormat}`);
  Analytics.trackEvent('Loaded User Settings', `moment.js Format`, `moment.js Format: ${momentJsFormatString}`);
};

const recordLoadedLeafletLayer = () => {
  const loadedLayerName = UserDataStorage.readOrDefault(UserDataStoragePath.LeafletMap.SelectedLayer, 'Not Loaded');
  Analytics.trackEvent('Leaflet Map', `Layer at App Launch: "${loadedLayerName}"`);
}

export const recordAtAppLaunch = () => {
  recordAppLaunch();
  recordLastLaunchDateTime();
  recordFirstLaunchDateTime();
  recordPeriodOfUse();
  recordLaunchCount();

  recordAppVer();
  recordDevOrProd();

  recordOs();

  recordDisplays();
  recordWindowState();

  recordLoadedUserSettings();

  recordLoadedLeafletLayer();
};
