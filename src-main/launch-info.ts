import * as moment from 'moment-timezone';
import { getMomentDiff, getMomentDiffAsIso8601, MomentDiffArgs } from '../src-shared/date-time/moment-diff';
import { Now } from '../src-shared/date-time/now';
import { UserDataStoragePath } from '../src-shared/user-data-storage/user-data-stroage-path';
import { UserDataStorage } from '../src-shared/user-data-storage/user-data-storage';

const isNaturalNumber = require('is-natural-number');

export class LaunchInfo {
  public static currentLaunchDateTime = Now.extendedFormat;
  public static lastLaunchDateTime: string;
  public static firstLaunchDateTime: string;
  public static periodOfUse: string;
  public static periodOfUseAsIso8601: string;
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
    UserDataStorage.write(UserDataStoragePath.History.LastLaunchDateTime, this.currentLaunchDateTime);
  }

  private static initializeFirstLaunchDateTimeAndPeriodOfUse(): void {
    let firstLaunchDateTime: string;

    try {
      firstLaunchDateTime = UserDataStorage.read(UserDataStoragePath.History.FirstLaunchDateTime);
    } catch {
      firstLaunchDateTime = this.currentLaunchDateTime;
      UserDataStorage.write(UserDataStoragePath.History.FirstLaunchDateTime, firstLaunchDateTime);
    }

    this.firstLaunchDateTime = firstLaunchDateTime;

    const args: MomentDiffArgs = {start: moment(firstLaunchDateTime), end: moment(this.currentLaunchDateTime)};
    const diff = getMomentDiff(args);
    this.periodOfUse = `${diff.years} years ${diff.months} months ${diff.days} days ${diff.hours} hours ${diff.minutes} minutes ${diff.seconds} seconds`;
    this.periodOfUseAsIso8601 = getMomentDiffAsIso8601(args);
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
