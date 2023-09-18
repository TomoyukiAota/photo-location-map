import { unitOfTime } from 'moment';

export interface DateTimeTakenChartXAxisUnit {
  displayStr: string;
  momentJsStr: unitOfTime.DurationConstructor;
}

export const xAxisUnit: {readonly [index: string]: DateTimeTakenChartXAxisUnit} = {
  year:   {displayStr: 'Year'  , momentJsStr: 'year'  },
  month:  {displayStr: 'Month' , momentJsStr: 'month' },
  day:    {displayStr: 'Day'   , momentJsStr: 'day'   },
  hour:   {displayStr: 'Hour'  , momentJsStr: 'hour'  },
  minute: {displayStr: 'Minute', momentJsStr: 'minute'},
  second: {displayStr: 'Second', momentJsStr: 'second'},
};

const displayStrToMomentJsStrMap = new Map<string, unitOfTime.DurationConstructor>([
  [xAxisUnit.year.displayStr  , xAxisUnit.year.momentJsStr  ],
  [xAxisUnit.month.displayStr , xAxisUnit.month.momentJsStr ],
  [xAxisUnit.day.displayStr   , xAxisUnit.day.momentJsStr   ],
  [xAxisUnit.hour.displayStr  , xAxisUnit.hour.momentJsStr  ],
  [xAxisUnit.minute.displayStr, xAxisUnit.minute.momentJsStr],
  [xAxisUnit.second.displayStr, xAxisUnit.second.momentJsStr],
]);

export function getXAxisUnitMomentJsStr(displayStr: string): unitOfTime.DurationConstructor {
  return displayStrToMomentJsStrMap.get(displayStr);
}
