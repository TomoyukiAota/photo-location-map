export namespace DateTimeFormat {
  export namespace ForLogging {
    export const basicFormat    = 'YYYYMMDDTHHmmss.SSS[Z]';      // Not very human-readable format, but this can be used in path.
    export const extendedFormat = 'YYYY-MM-DDTHH:mm:ss.SSS[Z]';  // Human-readable format
  }

  export namespace ForUser {
    export const DateFormat_ISO8601Like = 'YYYY-MM-DD';
    export const DateFormat_YYYYMMDD = 'YYYY/MM/DD';
    export const DateFormat_DDMMYYYY = 'DD/MM/YYYY';
    export const DateFormat_MMDDYYYY = 'MM/DD/YYYY';
    export const DateFormat_Default = DateFormat_ISO8601Like;

    export const ClockSystemFormat_12h = '12-hour';
    export const ClockSystemFormat_24h = '24-hour';
    export const ClockSystemFormat_Default = ClockSystemFormat_24h;

    export const DateFormat_List = [
      DateFormat_ISO8601Like,
      DateFormat_YYYYMMDD,
      DateFormat_DDMMYYYY,
      DateFormat_MMDDYYYY,
    ] as const;

    export const ClockSystemFormat_List = [
      ClockSystemFormat_12h,
      ClockSystemFormat_24h
    ] as const;

    export type DateFormatType = typeof DateFormat_List[number];
    export type ClockSystemFormatType = typeof ClockSystemFormat_List[number];

    export function getMomentJsDateTimeFormat(dateFormat: DateFormatType, clockSystemFormat: ClockSystemFormatType, option: {dayOfWeek: boolean} = {dayOfWeek: false}): string {
      const momentJsDateFormat = getMomentJsDateFormat(dateFormat, option);
      const momentJsTimeFormat = getMomentJsTimeFormat(clockSystemFormat);
      return `${momentJsDateFormat} ${momentJsTimeFormat}`;
    }

    export function getMomentJsDateHourMinuteFormat(dateFormat: DateFormatType, clockSystemFormat: ClockSystemFormatType): string {
      const momentJsDateFormat = getMomentJsDateFormat(dateFormat);
      const momentJsHourMinuteFormat = getMomentJsHourMinuteFormat(clockSystemFormat);
      return `${momentJsDateFormat} ${momentJsHourMinuteFormat}`;
    }

    export function getMomentJsDateHourFormat(dateFormat: DateFormatType, clockSystemFormat: ClockSystemFormatType): string {
      const momentJsDateFormat = getMomentJsDateFormat(dateFormat);
      const momentJsHourFormat = getMomentJsHourFormat(clockSystemFormat);
      return `${momentJsDateFormat} ${momentJsHourFormat}`;
    }

    export function getMomentJsDateFormat(dateFormat: DateFormatType, option: {dayOfWeek: boolean} = {dayOfWeek: false}): string {
      const dateFormatMap = new Map<DateFormatType, string>();
      if (option.dayOfWeek) {
        dateFormatMap.set(DateFormat_ISO8601Like, 'YYYY-MM-DD ddd');
        dateFormatMap.set(DateFormat_YYYYMMDD   , 'YYYY/MM/DD ddd');
        dateFormatMap.set(DateFormat_DDMMYYYY   , 'DD/MM/YYYY ddd');
        dateFormatMap.set(DateFormat_MMDDYYYY   , 'MM/DD/YYYY ddd');
      } else {
        dateFormatMap.set(DateFormat_ISO8601Like, 'YYYY-MM-DD');
        dateFormatMap.set(DateFormat_YYYYMMDD   , 'YYYY/MM/DD');
        dateFormatMap.set(DateFormat_DDMMYYYY   , 'DD/MM/YYYY');
        dateFormatMap.set(DateFormat_MMDDYYYY   , 'MM/DD/YYYY');
      }
      return dateFormatMap.get(dateFormat);
    }

    export function getMomentJsYearMonthFormat(dateFormat: DateFormatType): string {
      const yearMonthFormatMap = new Map<DateFormatType, string>(
        [
          [DateFormat_ISO8601Like, 'YYYY-MM' ],
          [DateFormat_YYYYMMDD   , 'YYYY/MM' ],
          [DateFormat_DDMMYYYY   , 'MM/YYYY' ],
          // eslint-disable-next-line max-len
          [DateFormat_MMDDYYYY   , 'MMM/YYYY'], // e.g. Oct/2012, Apr/2013. Months in English are used because 1) it's confusing to use MM/YYYY as the short form of MM/DD/YYYY and 2) MM/DD/YYYY format is mostly used in English-speaking countries.
        ]
      );
      return yearMonthFormatMap.get(dateFormat);
    }

    export function getMomentJsYearFormat(): string {
      return 'YYYY';
    }

    export function getMomentJsTimeFormat(clockSystemFormat: ClockSystemFormatType): string {
      return clockSystemFormat === ClockSystemFormat_24h
        ? `HH:mm:ss`
        : `hh:mm:ss a`;
    }

    export function getMomentJsHourMinuteFormat(clockSystemFormat: ClockSystemFormatType): string {
      return clockSystemFormat === ClockSystemFormat_24h
        ? `HH:mm`
        : `hh:mm a`;
    }

    export function getMomentJsHourFormat(clockSystemFormat: ClockSystemFormatType): string {
      return clockSystemFormat === ClockSystemFormat_24h
        ? `HH`
        : `hh a`;
    }
  }
}
