import moment from 'moment';
import { DateTimeOriginal } from '../shared/model/date-time-original';
import { Exif } from '../shared/model/exif.model';
import { Photo } from '../shared/model/photo.model';
import { createDateTimeTakenChartData } from './date-time-taken-chart-data';

function photo(takenAt: string | null): Photo {
  const exif = Object.assign(new Exif(), takenAt ? { dateTimeOriginal: new DateTimeOriginal(moment(takenAt)) } : {});
  return Object.assign(new Photo(), { name: 'photo.jpg', path: `/photos/${takenAt}.jpg`, filenameExtension: '.jpg', exif });
}

describe('createDateTimeTakenChartData', () => {
  it('counts the photos of each day from the first to the last, the empty days included', () => {
    const data = createDateTimeTakenChartData(
      [photo('2024-01-03T10:00:00'), photo('2024-01-01T09:00:00'), photo('2024-01-03T23:00:00'), photo(null)], 'day');

    expect(data.isSupportedDuration).toBe(true);
    expect(data.xData).toHaveLength(3);
    expect(data.yData).toEqual([1, 0, 2]);
  });

  it('counts by the unit of the x-axis', () => {
    const data = createDateTimeTakenChartData([photo('2022-05-01T00:00:00'), photo('2024-05-01T00:00:00')], 'year');

    expect(data.xData).toEqual(['2022', '2023', '2024']);
    expect(data.yData).toEqual([1, 0, 1]);
  });

  it('shows nothing, and says the duration is not supported, when the photos span more than the unit can show', () => {
    expect(createDateTimeTakenChartData([photo('2024-01-01T00:00:00'), photo('2024-03-01T00:00:00')], 'hour'))
      .toEqual({ xData: [], yData: [], isSupportedDuration: false });
  });

  it('shows nothing, without that message, when no photo has a shooting time', () => {
    expect(createDateTimeTakenChartData([photo(null)], 'day')).toEqual({ xData: [], yData: [], isSupportedDuration: true });
    expect(createDateTimeTakenChartData([], 'day')).toEqual({ xData: [], yData: [], isSupportedDuration: true });
  });
});
