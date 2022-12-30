import * as os from 'os';
import { app, screen } from 'electron';
import { Analytics } from '../src-shared/analytics/analytics';
import { DateTimeFormat } from '../src-shared/date-time/date-time-format';
import { DevOrProd } from '../src-shared/dev-or-prod/dev-or-prod';
import { Logger } from '../src-shared/log/logger';
import { UserDataStorage } from '../src-shared/user-data-storage/user-data-storage';
import { UserDataStoragePath } from '../src-shared/user-data-storage/user-data-stroage-path';
import { currentUserSettings } from '../src-shared/user-settings/user-settings';
import { LaunchInfo } from './launch-info';
import { LiveReload } from './live-reload';
import { recordWindowState } from './window-config';

const recordAppLaunch = () => {
  Analytics.trackEvent('App Launch', `App Launch`);
};

const recordCurrentLaunchDateTime = () => {
  const currentLaunchDateTime = LaunchInfo.currentLaunchDateTime;
  Analytics.trackEvent('Launch Info', `Launch Info: Current Launch Date`, `Current Launch Date: ${currentLaunchDateTime}`);
  Logger.info(`Current Launch Date: ${currentLaunchDateTime}`);
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
  const periodOfUseAsIso8601 = LaunchInfo.periodOfUseAsIso8601;
  Analytics.trackEvent('Launch Info', `Launch Info: Period of Use (ISO 8601)`, `Period of Use (ISO 8601): ${periodOfUseAsIso8601}`);
  Logger.info(`Period of Use (ISO 8601): ${periodOfUseAsIso8601}`);
};

const recordLaunchCount = () => {
  const launchCount = LaunchInfo.launchCount;
  Analytics.trackEvent('Launch Info', `Launch Info: Launch Count`, `Launch Count: ${launchCount}`);
  Logger.info(`Launch Count: ${launchCount}`);
};

const recordAppVer = () => {
  Analytics.trackEvent('App Ver', 'App Ver', `App Ver: ${app.getVersion()}`);
  Logger.info(`Application Version: ${app.getVersion()}`);
};

const recordDevOrProd = () => {
  Analytics.trackEvent('DevOrProd', 'DevOrProd', `DevOrProd: ${DevOrProd.toString()}`);
  Logger.info(`DevOrProd: ${DevOrProd.toString()}`);
};

const recordOs = () => {
  Analytics.trackEvent('OS Info', 'OS Info', `OS: ${os.platform()}`, `OS Ver: ${os.release()}`);
  Logger.info(`OS: ${os.platform()}; OS Ver: ${os.release()}`);
};

const recordDisplays = () => {
  const allDisplays = screen.getAllDisplays();
  Analytics.trackEvent('Display', `[Display] Number of Displays`, `Number of Displays: ${allDisplays.length}`);
  Logger.info(`[Display] Number of displays: ${allDisplays.length}`);
  allDisplays.forEach((display, index) => {
    Analytics.trackEvent('Display', `[Display] Each Display Info`, `Display ${index + 1}`, `Width: ${display.size.width}, Height: ${display.size.height}`);
    Logger.info(`[Display] Display ${index + 1}, Width: ${display.size.width}, Height: ${display.size.height}`);
  });
};

const recordLoadedUserSettings = () => {
  const settings = currentUserSettings;
  const momentJsFormatString = DateTimeFormat.ForUser.getMomentJsFormatString(settings.dateFormat, settings.clockSystemFormat);
  Analytics.trackEvent('Loaded User Settings', `Date Format`, `Date Format: ${settings.dateFormat}`);
  Analytics.trackEvent('Loaded User Settings', `Clock System Format`, `Clock System Format: ${settings.clockSystemFormat}`);
  Analytics.trackEvent('Loaded User Settings', `moment.js Format`, `moment.js Format: ${momentJsFormatString}`);
};

const recordLoadedLeafletBaseLayer = () => {
  const loadedBaseLayer = UserDataStorage.readOrDefault(UserDataStoragePath.LeafletMap.SelectedBaseLayer, 'Not Loaded');
  Analytics.trackEvent('Leaflet Map', `[Leaflet Map] Base Layer at App Launch`, `Base Layer at App Launch: "${loadedBaseLayer}"`);
};

export const recordAtAppLaunch = () => {
  recordAppLaunch();
  recordCurrentLaunchDateTime();
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

  recordLoadedLeafletBaseLayer();
};
