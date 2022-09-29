import * as moment from 'moment';

export interface MomentDiffArgs {
  start: moment.Moment;
  end: moment.Moment;
}

export interface MomentDiff {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

// Based on https://stackoverflow.com/a/53760332/7947548
// This function is defined because moment's duration object has the issue that
// the duration from 01/01/2013 to 01/01/2016 is 2y 11m 29d (where 3y is wanted)
export function getMomentDiff(args: MomentDiffArgs): MomentDiff {
  const startMoment = args.start.clone();
  const endMoment = args.end.clone();

  const years = endMoment.diff(startMoment, 'year');
  startMoment.add(years, 'years');

  const months = endMoment.diff(startMoment, 'months');
  startMoment.add(months, 'months');

  const days = endMoment.diff(startMoment, 'days');
  startMoment.add(days, 'days');

  const hours = endMoment.diff(startMoment, 'hours');
  startMoment.add(hours, 'hours');

  const minutes = endMoment.diff(startMoment, 'minutes');
  startMoment.add(minutes, 'minutes');

  const seconds = endMoment.diff(startMoment, 'seconds');

  return {years, months, days, hours, minutes, seconds};
}

export function getMomentDiffAsIso8601(args: MomentDiffArgs): string {
  const diff = getMomentDiff(args);
  return `P${diff.years}Y${diff.months}M${diff.days}DT${diff.hours}H${diff.minutes}M${diff.seconds}S`;
}
