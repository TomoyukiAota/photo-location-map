import { unitOfTime } from 'moment';

export interface XAxisUnit {
  displayStr: string;
  momentJsStr: unitOfTime.DurationConstructor;
}

export const xAxisUnit: {readonly [index: string]: XAxisUnit} = {
  day:   {displayStr: 'Day'  , momentJsStr: 'day'  },
  month: {displayStr: 'Month', momentJsStr: 'month'},
  year:  {displayStr: 'Year' , momentJsStr: 'year' },
};

export const displayUnitToMomentJsUnitMap = new Map<string, unitOfTime.DurationConstructor>([
  [xAxisUnit.day.displayStr  , xAxisUnit.day.momentJsStr  ],
  [xAxisUnit.month.displayStr, xAxisUnit.month.momentJsStr],
  [xAxisUnit.year.displayStr , xAxisUnit.year.momentJsStr ],
]);

export function getXAxisUnitForMomentJs(displayUnit: string): unitOfTime.DurationConstructor {
  return displayUnitToMomentJsUnitMap.get(displayUnit);
}
