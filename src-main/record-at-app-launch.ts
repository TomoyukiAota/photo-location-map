import * as os from 'os';
import { app, screen } from 'electron';
import { Analytics } from '../src-shared/analytics/analytics';
import { DateTimeFormat } from '../src-shared/date-time/date-time-format';
import { DevOrProd } from '../src-shared/dev-or-prod/dev-or-prod';
import { IpcConstants } from '../src-shared/ipc/ipc-constants';
import { Logger } from '../src-shared/log/logger';
import { toLoggableString } from '../src-shared/log/to-loggable-string';
import { UserDataStorage } from '../src-shared/user-data-storage/user-data-storage';
import { UserDataStoragePath } from '../src-shared/user-data-storage/user-data-stroage-path';
import { currentUserSettings } from '../src-shared/user-settings/user-settings';
import { commandLineOptionsValue } from './command-line-options/command-line-options-value';
import { mainWindow } from './electron-main';
import { LaunchInfo } from './launch-info';
import { recordWindowState } from './window-config';

const recordAppLaunch = () => {
  Analytics.trackEvent('App Launch', `App Launch`);
};

const recordCommandLineOptions = () => {
  Logger.info(`process.argv:\n${toLoggableString(process.argv)}`);
  const options = commandLineOptionsValue.get();
  Logger.info(`Parsed command line options:\n${toLoggableString(options)}`);
  Analytics.trackEvent('Command Line Options', 'Command Line Options: "--serve"', `Is "--serve" set? -> ${!!options.serve}`);
  Analytics.trackEvent('Command Line Options', 'Command Line Options: "--open <path>"', `Is "--open <path>" set? -> ${!!options.open}`);
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
  const momentJsFormatString = DateTimeFormat.ForUser.getMomentJsDateTimeFormat(settings.dateFormat, settings.clockSystemFormat);
  Analytics.trackEvent('Loaded User Settings', `Date Format`, `Date Format: ${settings.dateFormat}`);
  Analytics.trackEvent('Loaded User Settings', `Clock System Format`, `Clock System Format: ${settings.clockSystemFormat}`);
  Analytics.trackEvent('Loaded User Settings', `moment.js Format`, `moment.js Format: ${momentJsFormatString}`);
};

const recordLoadedLeafletBaseLayer = () => {
  const loadedBaseLayer = UserDataStorage.readOrDefault(UserDataStoragePath.LeafletMap.SelectedBaseLayer, 'Not Loaded');
  Analytics.trackEvent('Leaflet Map', `[Leaflet Map] Base Layer at App Launch`, `Base Layer at App Launch: "${loadedBaseLayer}"`);
};

const recordSidebarMenuSortKey = () => {
  const sortKey = UserDataStorage.readOrDefault(UserDataStoragePath.DirectoryTreeView.SortKey, 'Not Loaded');
  Analytics.trackEvent('Sidebar Menu', `[Sort] Key at App Launch`, `Sort Key at App Launch: ${sortKey}`);
};

const recordSideBarMenuSortDirection = () => {
  const sortDirection = UserDataStorage.readOrDefault(UserDataStoragePath.DirectoryTreeView.SortDirection, 'Not Loaded');
  Analytics.trackEvent('Sidebar Menu', `[Sort] Direction at App Launch`, `Sort Direction at App Launch: ${sortDirection}`);
};

const finishRecordAtAppLaunch = () => {
  mainWindow.webContents.send(IpcConstants.RecordAtAppLaunch.Finished);
};

export const recordAtAppLaunch = () => {
  recordAppLaunch();
  recordCommandLineOptions();
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

  recordSidebarMenuSortKey();
  recordSideBarMenuSortDirection();

  finishRecordAtAppLaunch();
};
