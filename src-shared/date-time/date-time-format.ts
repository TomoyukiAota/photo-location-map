export namespace DateTimeFormat {
  export namespace ForLogging {
    export const basicFormat    = 'YYYYMMDDTHHmmss.SSS[Z]';      // Not very human-readable format, but this can be used in path.
    export const extendedFormat = 'YYYY-MM-DDTHH:mm:ss.SSS[Z]';  // Human-readable format
  }

  export namespace ForUser {
    export const Date_ISO8601Like = 'YYYY-MM-DD';
    export const Date_YYYYMMDD = 'YYYY/MM/DD';
    export const Date_DDMMYYYY = 'DD/MM/YYYY';
    export const Date_MMDDYYYY = 'MM/DD/YYYY';
    export const Date_Default = Date_ISO8601Like;

    export const ClockSystem_12h = '12-hour';
    export const ClockSystem_24h = '24-hour';
    export const ClockSystem_Default = ClockSystem_24h;

    export const dateFormatList = [
      Date_ISO8601Like,
      Date_YYYYMMDD,
      Date_DDMMYYYY,
      Date_MMDDYYYY,
    ] as const;

    export const clockSystemFormatList = [
      ClockSystem_12h,
      ClockSystem_24h
    ];

    export type DateFormatType = typeof dateFormatList[number];
    export type ClockSystemFormatType = typeof clockSystemFormatList[number];

    export const getMomentJsFormatString = (dateFormat: DateFormatType, clockSystemFormat: ClockSystemFormatType): string => {
      const dateFormatMap = new Map<DateFormatType, string>();
      dateFormatMap.set(Date_ISO8601Like, 'YYYY-MM-DD ddd');
      dateFormatMap.set(Date_YYYYMMDD   , 'YYYY/MM/DD ddd');
      dateFormatMap.set(Date_DDMMYYYY   , 'DD/MM/YYYY ddd');
      dateFormatMap.set(Date_MMDDYYYY   , 'MM/DD/YYYY ddd');
      const momentJsDateFormat = dateFormatMap.get(dateFormat);
      const momentJsFormat = clockSystemFormat === ClockSystem_24h
        ? `${momentJsDateFormat} HH:mm:ss`
        : `${momentJsDateFormat} hh:mm:ss a`;
      return momentJsFormat;
    };
  }
}
