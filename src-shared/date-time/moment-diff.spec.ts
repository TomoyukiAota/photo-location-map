import * as moment from 'moment';
import { getMomentDiff, getMomentDiffAsIso8601 } from './moment-diff';

describe('getMomentDiff', () => {
  it('General case 1: from [2007, 6, 27] to [2015, 11, 29]', () => {
    const start = moment([2007, 6, 27]);
    const end   = moment([2015, 11, 29]);
    const diff  = getMomentDiff({start, end});
    expect(diff).toEqual({years: 8, months: 5, days: 2, hours: 0, minutes: 0, seconds: 0});
  });

  it('General case 2: from [2010, 1, 14, 15, 25, 50] to [2011, 3, 17, 19, 30, 56]', () => {
    const start = moment([2010, 1, 14, 15, 25, 50]);
    const end   = moment([2011, 3, 17, 19, 30, 56]);
    const diff  = getMomentDiff({start, end});
    expect(diff).toEqual({years: 1, months: 2, days: 3, hours: 4, minutes: 5, seconds: 6});
  });

  it('General case 3: from [2010, 1, 14, 15, 25, 50] to [2011, 3, 24, 19, 30, 56] for testing days more than a week', () => {
    const start = moment([2010, 1, 14, 15, 25, 50]);
    const end   = moment([2011, 3, 24, 19, 30, 56]);
    const diff  = getMomentDiff({start, end});
    expect(diff).toEqual({years: 1, months: 2, days: 10, hours: 4, minutes: 5, seconds: 6});
  });

  // For this test case, moment's duration incorrectly gives 8 years 0 months 1 days
  // See the comment in https://stackoverflow.com/a/33988284/7947548
  it('Edge case 1: from [2007, 11, 29] to [2015, 11, 29]', () => {
    const start = moment([2007, 11, 29]);
    const end   = moment([2015, 11, 29]);
    const diff  = getMomentDiff({start, end});
    expect(diff).toEqual({years: 8, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0});
  });

  // For this test case, moment's duration incorrectly gives 2 years 11 months 29 days
  // See the comment in https://stackoverflow.com/a/34001163/7947548
  it('Edge case 2: from [2013, 1, 1] to [2016, 1, 1]', () => {
    const start = moment([2013, 1, 1]);
    const end   = moment([2016, 1, 1]);
    const diff  = getMomentDiff({start, end});
    expect(diff).toEqual({years: 3, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0});
  });

  it('should not mutate the given moment instances', () => {
    const start = moment([2010, 1, 14, 15, 25, 50]);
    const end   = moment([2011, 3, 17, 19, 30, 56]);
    const diff1 = getMomentDiff({start, end});
    expect(diff1).toEqual({years: 1, months: 2, days: 3, hours: 4, minutes: 5, seconds: 6});

    expect(start.year()  ).toEqual(2010);
    expect(start.month() ).toEqual(1);
    expect(start.date()  ).toEqual(14);
    expect(start.hour()  ).toEqual(15);
    expect(start.minute()).toEqual(25);
    expect(start.second()).toEqual(50);

    expect(end.year()  ).toEqual(2011);
    expect(end.month() ).toEqual(3);
    expect(end.date()  ).toEqual(17);
    expect(end.hour()  ).toEqual(19);
    expect(end.minute()).toEqual(30);
    expect(end.second()).toEqual(56);

    const diff2 = getMomentDiff({start, end});
    expect(diff2).toEqual(diff1); // diff2 and diff1 should be the same because moment instances are not mutated
  });
});

describe('getMomentDiffAsIso8601', () => {
  it('should return ISO 8601 string', () => {
    const start = moment([2010, 1, 14, 15, 25, 50]);
    const end   = moment([2011, 3, 17, 19, 30, 56]);
    const diff  = getMomentDiffAsIso8601({start, end});
    expect(diff).toEqual(`P1Y2M3DT4H5M6S`);
  });
});
