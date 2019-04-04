import * as moment from 'moment-timezone';

export class DateTime {
  public static dateTimeInBasicFormat() {
    return moment.utc().format('YYYYMMDDTHHmmss.SSS[Z]');
  }

  public static dateTimeInExtendedFormat() {
      return moment.utc().format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
  }
}
