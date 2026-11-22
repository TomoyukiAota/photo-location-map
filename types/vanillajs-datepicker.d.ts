// vanillajs-datepicker publishes no types: what the date of the map uses of it
// (src/app/map/leaflet-map/dated-layers/map-date/map-date-picker.component.ts), as its documentation describes it
// (https://mymth.github.io/vanillajs-datepicker/#/api).
declare module 'vanillajs-datepicker' {
  /** A language of the datepicker: its names of the days and months, and how it writes the title of a month. */
  export interface DatepickerLocale {
    days?: string[];
    daysShort?: string[];
    daysMin?: string[];
    months?: string[];
    monthsShort?: string[];
    today?: string;
    clear?: string;
    titleFormat?: string;
    format?: string;
    weekStart?: number;
    rtl?: boolean;
  }

  export interface DatepickerOptions {
    autohide?: boolean;
    container?: string | HTMLElement;
    format?: string;
    language?: string;
    maxDate?: Date | string | number;
    minDate?: Date | string | number;
    orientation?: string;
    todayHighlight?: boolean;
    updateOnBlur?: boolean;
  }

  export interface SetDateOptions {
    clear?: boolean;
    render?: boolean;
    autohide?: boolean;
    revert?: boolean;
    forceRefresh?: boolean;
  }

  export class Datepicker {
    static locales: Record<string, DatepickerLocale>;
    constructor(element: HTMLElement, options?: DatepickerOptions);
    readonly active: boolean;
    readonly pickerElement: HTMLElement;
    getDate(): Date | undefined;
    setDate(date: Date | string | number, options?: SetDateOptions): void;
    show(): void;
    hide(): void;
    destroy(): this;
  }

  /** The detail of the datepicker's events, such as changeDate, which are dispatched to its input. */
  export interface DatepickerEventDetail {
    date: Date | undefined;
    datepicker: Datepicker;
  }
}

declare module 'vanillajs-datepicker/locales/*' {
  /** One language, by its name in the datepicker. */
  const locale: Record<string, import('vanillajs-datepicker').DatepickerLocale>;
  export default locale;
}
