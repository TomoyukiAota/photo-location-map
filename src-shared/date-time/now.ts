import moment from 'moment-timezone';
import { DateTimeFormat } from './date-time-format.js';

export class Now {
  public static get basicFormat(): string {
    return moment.utc().format(DateTimeFormat.ForLogging.basicFormat);
  }

  public static get extendedFormat(): string {
    return moment.utc().format(DateTimeFormat.ForLogging.extendedFormat);
  }
}
