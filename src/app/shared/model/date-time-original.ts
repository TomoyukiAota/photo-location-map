import moment from 'moment';
import { DateFormatOption } from '../../../../src-shared/date-time/date-time-format.js';
import { momentToDateString, momentToDateTimeString, momentToTimeString } from '../moment-to-string.js';

export class DateTimeOriginal {
  constructor(dateOrMoment: Date | ReturnType<typeof import('moment')>) {
    this.moment = moment(dateOrMoment);
  }

  public readonly moment: ReturnType<typeof import('moment')>;

  public toDateTimeString(option = new DateFormatOption()): string {
    return momentToDateTimeString(this.moment, option);
  }

  public toDateString(option = new DateFormatOption()): string {
    return momentToDateString(this.moment, option);
  }

  public toTimeString(): string {
    return momentToTimeString(this.moment);
  }
}
