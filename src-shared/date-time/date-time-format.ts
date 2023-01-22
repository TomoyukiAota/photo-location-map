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

    export function getMomentJsDateTimeFormat(dateFormat: DateFormatType, clockSystemFormat: ClockSystemFormatType): string {
      const momentJsDateFormat = getMomentJsDateFormat(dateFormat);
      const momentJsTimeFormat = getMomentJsTimeFormat(clockSystemFormat);
      return `${momentJsDateFormat} ${momentJsTimeFormat}`;
    }

    export function getMomentJsDateFormat(dateFormat: DateFormatType, option: {dayOfWeek: boolean} = {dayOfWeek: true}): string {
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

    export function getMomentJsTimeFormat(clockSystemFormat: ClockSystemFormatType): string {
      return clockSystemFormat === ClockSystemFormat_24h
        ? `HH:mm:ss`
        : `hh:mm:ss a`;
    }
  }
}
