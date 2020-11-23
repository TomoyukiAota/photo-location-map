import * as moment from 'moment-timezone';
import { Now } from '../src-shared/date-time/now';
import { UserDataStoragePath } from '../src-shared/user-data-storage/user-data-stroage-path';
import { UserDataStorage } from '../src-shared/user-data-storage/user-data-storage';

const isNaturalNumber = require('is-natural-number');

const now = Now.extendedFormat;

export class LaunchInfo {
  public static lastLaunchDateTime: string;
  public static firstLaunchDateTime: string;
  public static periodOfUse: string;
  public static launchCount: number;

  public static get isFirstLaunch(): boolean {
    return this.launchCount === 1;
  }

  public static initialize(): void {
    this.initializeLastLaunchDateTime();
    this.initializeFirstLaunchDateTimeAndPeriodOfUse();
    this.initializeLaunchCount();
  }

  private static initializeLastLaunchDateTime(): void {
    this.lastLaunchDateTime = UserDataStorage.readOrDefault(
      UserDataStoragePath.History.LastLaunchDateTime,
      '"This is the first launch."');
    UserDataStorage.write(UserDataStoragePath.History.LastLaunchDateTime, now);
  }

  private static initializeFirstLaunchDateTimeAndPeriodOfUse(): void {
    let firstLaunchDateTime: string;

    try {
      firstLaunchDateTime = UserDataStorage.read(UserDataStoragePath.History.FirstLaunchDateTime);
    } catch {
      firstLaunchDateTime = now;
      UserDataStorage.write(UserDataStoragePath.History.FirstLaunchDateTime, firstLaunchDateTime);
    }

    this.firstLaunchDateTime = firstLaunchDateTime;

    const duration = moment.duration(moment(now).diff(moment(firstLaunchDateTime)));
    this.periodOfUse = duration.toISOString();
  }

  private static initializeLaunchCount(): void {
    const prevLaunchCountStr = UserDataStorage.readOrDefault(
      UserDataStoragePath.History.LaunchCount,
      '0');
    const maybePrevLaunchCount = Number(prevLaunchCountStr);
    const prevLaunchCount = isNaturalNumber(maybePrevLaunchCount, {includeZero: true}) ? maybePrevLaunchCount : 0;
    this.launchCount = prevLaunchCount + 1;
    UserDataStorage.write(UserDataStoragePath.History.LaunchCount, this.launchCount.toString());
  }

}

LaunchInfo.initialize();
