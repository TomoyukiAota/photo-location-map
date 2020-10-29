import { DateTimeFormat } from '../../../../src-shared/date-time/date-time-format';
import DateFormatType = DateTimeFormat.ForUser.DateFormatType;
import ClockSystemFormatType = DateTimeFormat.ForUser.ClockSystemFormatType;

export class DateTimeSettingsChangedParameter {
  dateFormat: DateFormatType;
  clockSystemFormat: ClockSystemFormatType;
}
