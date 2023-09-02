export interface XAxisUnit {
  displayStr: string;
  momentJsStr: string;
}

export const xAxisUnit: {readonly [index: string]: XAxisUnit} = {
  day:   {displayStr: 'Day'  , momentJsStr: 'day'  },
  month: {displayStr: 'Month', momentJsStr: 'month'},
  year:  {displayStr: 'Year' , momentJsStr: 'year' },
};

export const displayUnitToMomentJsUnitMap = new Map<string, string>([
  [xAxisUnit.day.displayStr  , xAxisUnit.day.momentJsStr  ],
  [xAxisUnit.month.displayStr, xAxisUnit.month.momentJsStr],
  [xAxisUnit.year.displayStr , xAxisUnit.year.momentJsStr ],
]);

export function getXAxisUnitForMomentJs(displayUnit: string): string {
  return displayUnitToMomentJsUnitMap.get(displayUnit);
}
