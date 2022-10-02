import * as moment from 'moment';

// Note for using moment.js's duration:
// moment.js's duration does not always return good results regarding the diff of two moments,
// but it should be used instead of hand-crafted logic due to the following reasons:
// 1) Developing hand-crafted logic covering all edge cases seems very difficult.
//    It's due to the fact that a year can be 365 or 366 days and a month can be 28, 29, 30, or 31 days.
//    The result could be totally nonsensical (e.g. NaN) if something goes wrong.
//    In fact, I tried developing hand-crafted logic but ended up having NaN for the cases I initially didn't come up with.
// 2) The use cases are analytics as of October 2022, which does not require precise results.
//    Results with errors to some degree are acceptable as long as nonsensical results like NaN does not appear.
//    I'm not certain about the degree of the error of duration in moment.js,
//    but I believe it's better than hand-crafted logic because it's been used for a long time by many users.
//    It's not worth spending a lot of time on developing hand-crafted logic for the places where errors are accepted to some degree.

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

export function getMomentDiff(args: MomentDiffArgs): MomentDiff {
  const startMoment = args.start.clone();
  const endMoment = args.end.clone();

  const duration = moment.duration(endMoment.diff(startMoment));
  const years = duration.years();
  const months = duration.months();
  const days = duration.days();
  const hours = duration.hours();
  const minutes = duration.minutes();
  const seconds = duration.seconds();

  return {years, months, days, hours, minutes, seconds};
}

export function getMomentDiffAsIso8601(args: MomentDiffArgs): string {
  const diff = getMomentDiff(args);
  return `P${diff.years}Y${diff.months}M${diff.days}DT${diff.hours}H${diff.minutes}M${diff.seconds}S`;
}
