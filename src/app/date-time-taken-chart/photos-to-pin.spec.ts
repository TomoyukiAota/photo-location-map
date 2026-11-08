import moment from 'moment';
import { DateTimeOriginal } from '../shared/model/date-time-original';
import { Exif } from '../shared/model/exif.model';
import { Photo } from '../shared/model/photo.model';
import { momentToStringMap } from '../shared/moment-to-string-map';
import { photosToPin } from './photos-to-pin';

/** A photo taken at the moment given, or with no shooting time when it is null. */
function photo(name: string, takenAt: string | null): Photo {
  const exif = Object.assign(new Exif(), takenAt ? { dateTimeOriginal: new DateTimeOriginal(moment(takenAt)) } : {});
  return Object.assign(new Photo(), { name, path: `/photos/${name}.jpg`, filenameExtension: '.jpg', exif });
}

const names = (photos: Photo[]) => photos.map(photo => photo.name);

describe('photosToPin', () => {
  // In the order of a selection, with a photo without a shooting time in between.
  const selected = [photo('2013', '2013-12-18T15:43:34'), photo('unknown', null), photo('2019', '2019-03-16T17:29:58')];

  it('pins every selected photo, in the order of the selection, when the chart is not zoomed', () => {
    // As after a new selection, a new unit of the x-axis or a reset of the zoom.
    expect(names(photosToPin(selected, { xValuesWithinZoom: null, xAxisUnit: 'year', showDateUnknownPhotos: true })))
      .toEqual(['2013', 'unknown', '2019']);
  });

  it('pins the photos taken within the zoom, without those that have no shooting time, as a zoom leaves them out', () => {
    expect(names(photosToPin(selected, { xValuesWithinZoom: ['2019'], xAxisUnit: 'year', showDateUnknownPhotos: false })))
      .toEqual(['2019']);
  });

  it('adds the photos without a shooting time to those within the zoom when the checkbox asks for them', () => {
    expect(names(photosToPin(selected, { xValuesWithinZoom: ['2019'], xAxisUnit: 'year', showDateUnknownPhotos: true })))
      .toEqual(['unknown', '2019']);
  });

  it('leaves out only the photos without a shooting time when the checkbox is cleared without a zoom', () => {
    expect(names(photosToPin(selected, { xValuesWithinZoom: null, xAxisUnit: 'year', showDateUnknownPhotos: false })))
      .toEqual(['2013', '2019']);
  });

  it('compares a shooting time with the values of the x-axis in its unit', () => {
    // A day is shown in the date format of the user's settings, as the chart's x-axis shows it.
    const day = momentToStringMap.get('day')(moment('2019-03-16T00:00:00'));
    expect(names(photosToPin(selected, { xValuesWithinZoom: [day], xAxisUnit: 'day', showDateUnknownPhotos: false })))
      .toEqual(['2019']);
    // A year is not a day.
    expect(photosToPin(selected, { xValuesWithinZoom: ['2019'], xAxisUnit: 'day', showDateUnknownPhotos: false }))
      .toEqual([]);
  });
});
