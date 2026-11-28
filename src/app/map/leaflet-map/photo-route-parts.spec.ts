import { DateTimeOriginal } from '../../shared/model/date-time-original';
import { Exif } from '../../shared/model/exif.model';
import { LatLng } from '../../shared/model/lat-lng.model';
import { Photo } from '../../shared/model/photo.model';
import { photoRouteParts, type RoutePoint } from './photo-route-parts';

function photo(path: string, point: RoutePoint | undefined, time?: string): Photo {
  const exif = new Exif();
  if (point) exif.gpsInfo = { latLng: new LatLng(...point) };
  if (time !== undefined) exif.dateTimeOriginal = new DateTimeOriginal(new Date(time));
  return Object.assign(new Photo(), { path, name: path.split('/').at(-1), exif });
}

const morning = '2025-09-14T10:00:00Z';
const afternoon = '2025-09-14T14:00:00Z';
const nextDay = '2025-09-15T10:00:00Z';

describe('photoRouteParts', () => {
  it('connects photos in shooting order across days, independently of their input order or names', () => {
    const first = photo('/z.jpg', [25, 35], morning);
    const second = photo('/y.jpg', [26, 36], afternoon);
    const third = photo('/x.jpg', [27, 37], nextDay);

    expect(photoRouteParts([second, third, first])).toEqual([[[25, 35], [26, 36], [27, 37]]]);
  });

  it('breaks shooting time ties by name and full path, using case as the last distinction', () => {
    const first = photo('/a/Alpha.JPG', [25, 35], morning);
    const second = photo('/a/alpha.jpg', [26, 36], morning);
    const third = photo('/Z/alpha.jpg', [27, 37], morning);
    const fourth = photo('/a/b.jpg', [28, 38], morning);

    expect(photoRouteParts([third, second, fourth, first])).toEqual([[[25, 35], [26, 36], [27, 37], [28, 38]]]);
  });

  it('skips photos with missing or invalid times and locations', () => {
    const photos = [
      photo('/first.jpg', [25, 35], morning),
      photo('/missing-time.jpg', [42, 42]),
      photo('/invalid-time.jpg', [43, 43], 'invalid'),
      photo('/missing-location.jpg', undefined, afternoon),
      photo('/invalid-latitude.jpg', [91, 44], afternoon),
      photo('/invalid-longitude.jpg', [44, Number.NaN], afternoon),
      photo('/zero-coordinate.jpg', [0, 44], afternoon),
      photo('/second.jpg', [26, 36], nextDay),
    ];

    expect(photoRouteParts(photos)).toEqual([[[25, 35], [26, 36]]]);
  });

  it('draws nothing unless at least two locations differ', () => {
    const first = photo('/first.jpg', [25, 180], morning);
    const duplicate = photo('/second.jpg', [25, -180], afternoon);

    expect(photoRouteParts([])).toEqual([]);
    expect(photoRouteParts([first])).toEqual([]);
    expect(photoRouteParts([first, duplicate])).toEqual([]);
  });

  it('collapses consecutive identical locations and keeps returns to an earlier location', () => {
    const first = photo('/first.jpg', [25, 35], morning);
    const duplicate = photo('/second.jpg', [25, 35], afternoon);
    const elsewhere = photo('/elsewhere.jpg', [26, 36], nextDay);
    const returnVisit = photo('/return.jpg', [25, 35], '2025-09-15T14:00:00Z');

    expect(photoRouteParts([first, duplicate, elsewhere, returnVisit])).toEqual([[[25, 35], [26, 36], [25, 35]]]);
  });

  it('splits a crossing in each direction and keeps the order of the resulting parts', () => {
    const east = photo('/east.jpg', [25, 179], morning);
    const west = photo('/west.jpg', [25, -179], afternoon);
    const eastAgain = photo('/east-again.jpg', [25, 178], nextDay);

    expect(photoRouteParts([east, west, eastAgain])).toEqual([
      [[25, 179], [25, 180]],
      [[25, -180], [25, -179], [25, -180]],
      [[25, 180], [25, 178]],
    ]);
  });

  it('interpolates a crossing at the latitude of the straight projected segment', () => {
    const east = photo('/east.jpg', [30, 179], morning);
    const west = photo('/west.jpg', [55, -179], afternoon);
    const [eastPart, westPart] = photoRouteParts([east, west]);
    const crossingLatitude = eastPart[1][0];

    expect(crossingLatitude).toBeCloseTo(43.7880965228, 8);
    expect(eastPart).toEqual([[30, 179], [crossingLatitude, 180]]);
    expect(westPart).toEqual([[crossingLatitude, -180], [55, -179]]);
  });

  it('splits at a photo on either representation of the edge without a zero-length part', () => {
    const east = photo('/east.jpg', [25, 179], morning);
    const west = photo('/west.jpg', [35, -179], nextDay);
    const boundaryEast = photo('/boundary.jpg', [30, 180], afternoon);
    const boundaryWest = photo('/boundary.jpg', [30, -180], afternoon);
    const expectedParts = [
      [[25, 179], [30, 180]],
      [[30, -180], [35, -179]],
    ];

    expect(photoRouteParts([east, boundaryEast, west])).toEqual(expectedParts);
    expect(photoRouteParts([east, boundaryWest, west])).toEqual(expectedParts);
    expect(photoRouteParts([boundaryEast, west])).toEqual([expectedParts[1]]);
    expect(photoRouteParts([east, boundaryWest])).toEqual([expectedParts[0]]);
  });

  it('keeps movement along the edge when the pins store opposite longitudes', () => {
    const first = photo('/first.jpg', [25, 180], morning);
    const second = photo('/second.jpg', [35, -180], afternoon);

    expect(photoRouteParts([first, second])).toEqual([[[25, 180], [35, 180]]]);
  });
});
