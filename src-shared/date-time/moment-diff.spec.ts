import * as moment from 'moment';
import { getMomentDiff, getMomentDiffAsIso8601 } from './moment-diff';

describe('getMomentDiff', () => {
  it('General case: from [2007, 6, 17, 15, 25, 50] to [2015, 11, 29, 19, 30, 56]', () => {
    // start & end are chosen so that
    // 1) days more than a week (7 days) is tested, and
    // 2) years/months/days/hours/minutes/seconds have different values.
    const start = moment([2007,  6, 17, 15, 25, 50]);
    const end   = moment([2015, 11, 29, 19, 30, 56]);
    const diff  = getMomentDiff({start, end});
    expect(diff).toEqual({years: 8, months: 5, days: 12, hours: 4, minutes: 5, seconds: 6});
  });

  it('Edge case 1: from [2007, 11, 29] to [2015, 11, 29]', () => {
    const start = moment([2007, 11, 29]);
    const end   = moment([2015, 11, 29]);
    const diff  = getMomentDiff({start, end});
    expect(diff).toEqual({years: 8, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0});
  });

  // For this test case, moment.js's duration gives 2 years 11 months 29 days instead of 3 years.
  // See the comment in https://stackoverflow.com/a/34001163/7947548
  // It does not seem correct, but moment.js's duration is used instead of hand-crafted logic because
  // 1) it's very difficult to correctly handle all edge cases with hand-crafted logic, and
  // 2) as of October 2022 the use case is analytics which can accept errors to some degree.
  it('Edge case 2: from [2013, 1, 1] to [2016, 1, 1]', () => {
    const start = moment([2013, 1, 1]);
    const end   = moment([2016, 1, 1]);
    const diff  = getMomentDiff({start, end});
    expect(diff).toEqual({years: 2, months: 11, days: 29, hours: 0, minutes: 0, seconds: 0});
  });

  it('should not mutate the given moment instances', () => {
    const startArray = [2007,  6, 17, 15, 25, 50];
    const endArray   = [2015, 11, 29, 19, 30, 56];
    const start = moment(startArray);
    const end   = moment(endArray);
    const diff1 = getMomentDiff({start, end});
    expect(diff1).toEqual({years: 8, months: 5, days: 12, hours: 4, minutes: 5, seconds: 6});

    expect(start.year()  ).toEqual(startArray[0]);
    expect(start.month() ).toEqual(startArray[1]);
    expect(start.date()  ).toEqual(startArray[2]);
    expect(start.hour()  ).toEqual(startArray[3]);
    expect(start.minute()).toEqual(startArray[4]);
    expect(start.second()).toEqual(startArray[5]);

    expect(end.year()  ).toEqual(endArray[0]);
    expect(end.month() ).toEqual(endArray[1]);
    expect(end.date()  ).toEqual(endArray[2]);
    expect(end.hour()  ).toEqual(endArray[3]);
    expect(end.minute()).toEqual(endArray[4]);
    expect(end.second()).toEqual(endArray[5]);

    const diff2 = getMomentDiff({start, end});
    expect(diff2).toEqual(diff1); // diff2 and diff1 should be the same because moment instances are not mutated
  });
});

describe('getMomentDiffAsIso8601', () => {
  it('should return ISO 8601 string', () => {
    const start = moment([2007,  6, 17, 15, 25, 50]);
    const end   = moment([2015, 11, 29, 19, 30, 56]);
    const diff  = getMomentDiffAsIso8601({start, end});
    expect(diff).toEqual(`P8Y5M12DT4H5M6S`);
  });
});
