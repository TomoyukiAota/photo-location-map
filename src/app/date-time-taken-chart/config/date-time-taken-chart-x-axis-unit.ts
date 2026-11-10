import { unitOfTime } from 'moment';
import { TranslationKey } from '../../../../src-shared/i18n/translation-key';

export interface DateTimeTakenChartXAxisUnit {
  /** The key of the unit's name, which the chart's select shows. */
  labelKey: TranslationKey;
  /** The unit as moment names it, which also identifies it: the value of its option, and what analytics records. */
  momentJsStr: unitOfTime.DurationConstructor;
}

export const xAxisUnit = {
  year:   {labelKey: 'chart.units.year'  , momentJsStr: 'year'  },
  month:  {labelKey: 'chart.units.month' , momentJsStr: 'month' },
  day:    {labelKey: 'chart.units.day'   , momentJsStr: 'day'   },
  hour:   {labelKey: 'chart.units.hour'  , momentJsStr: 'hour'  },
  minute: {labelKey: 'chart.units.minute', momentJsStr: 'minute'},
  second: {labelKey: 'chart.units.second', momentJsStr: 'second'},
} as const satisfies {readonly [index: string]: DateTimeTakenChartXAxisUnit};

/** The units, in the order that the chart's select lists them. */
export const xAxisUnits: readonly DateTimeTakenChartXAxisUnit[] = Object.values(xAxisUnit);
