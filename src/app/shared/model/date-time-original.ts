import * as moment from 'moment';
import { DateTimeFormat } from '../../../../src-shared/date-time/date-time-format';
import { currentUserSettings } from '../../../../src-shared/user-settings/user-settings';

export class DateTimeOriginal {
  constructor(dateOrMoment: Date | ReturnType<typeof import('moment')>) {
    this.moment = moment(dateOrMoment);
  }

  public readonly moment: ReturnType<typeof import('moment')>;

  public displayString(): string {
    const dateFormat = currentUserSettings.dateFormat;
    const clockSystemFormat = currentUserSettings.clockSystemFormat;
    const momentJsFormatString = DateTimeFormat.ForUser.getMomentJsFormatString(dateFormat, clockSystemFormat);
    return this.moment.format(momentJsFormatString);
  }
}
