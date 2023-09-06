import { unitOfTime } from 'moment';

export interface DateTimeTakenChartXAxisUnit {
  displayStr: string;
  momentJsStr: unitOfTime.DurationConstructor;
}

export const xAxisUnit: {readonly [index: string]: DateTimeTakenChartXAxisUnit} = {
  hour:  {displayStr: 'Hour' , momentJsStr: 'hour' },
  day:   {displayStr: 'Day'  , momentJsStr: 'day'  },
  month: {displayStr: 'Month', momentJsStr: 'month'},
  year:  {displayStr: 'Year' , momentJsStr: 'year' },
};

const displayStrToMomentJsStrMap = new Map<string, unitOfTime.DurationConstructor>([
  [xAxisUnit.hour.displayStr , xAxisUnit.hour.momentJsStr ],
  [xAxisUnit.day.displayStr  , xAxisUnit.day.momentJsStr  ],
  [xAxisUnit.month.displayStr, xAxisUnit.month.momentJsStr],
  [xAxisUnit.year.displayStr , xAxisUnit.year.momentJsStr ],
]);

export function getXAxisUnitMomentJsStr(displayStr: string): unitOfTime.DurationConstructor {
  return displayStrToMomentJsStrMap.get(displayStr);
}
