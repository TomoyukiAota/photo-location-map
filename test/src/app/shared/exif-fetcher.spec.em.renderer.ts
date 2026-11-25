import { createDirectoryTree } from '../../../../src-shared/dir-tree/create-directory-tree.js';
import assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { nearlyEqual } from '../../../test-util/number-comparison.js';
import { ExifFetcher, PathExifPair } from '../../../../src/app/shared/exif-fetcher/exif-fetcher.js';
import { exifReadFailures } from '../../../../src/app/shared/exif-fetcher/exif-read-failures.js';
import { isExifThumbnailOnItsSide } from '../../../../src/app/shared/exif-thumbnail-on-its-side.js';
import { fetchExifUsingExifr } from '../../../../src/app/shared/exif-fetcher/using-exifr/fetch-exif-using-exifr.js';
import { repositoryPath } from '../../../test-util/repository.js';
import { jpegWithEmptyGpsValues } from '../../../test-util/jpeg-with-empty-gps-values.mjs';

const testResourceDirectory = repositoryPath('test', 'test-resources');

describe('fetchExifUsingExifr', () => {
  let directory: string;

  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'plm-exif-fetcher-'));
  });

  afterEach(() => {
    fs.rmSync(directory, { recursive: true, force: true });
  });

  // exifr gives the text "NaNNaN" for such a file, which Leaflet throws on.
  it('should give no GPS info for a GPS block whose values are empty', async () => {
    const filePath = path.join(directory, 'empty-gps.JPG');
    const source = fs.readFileSync(path.join(testResourceDirectory, 'actual-photos', 'Kobe', 'IMG_4676.JPG'));
    fs.writeFileSync(filePath, jpegWithEmptyGpsValues(source));

    const exif = await fetchExifUsingExifr(filePath);
    assert(exif !== null);
    assert.strictEqual(exif.gpsInfo, undefined);
  });

  it('should count a file that cannot be read by why, without its name', async () => {
    const filePath = path.join(directory, 'Trip to Kyoto 0001.jpg');
    fs.writeFileSync(filePath, 'not a photo');
    exifReadFailures.clear();

    assert.strictEqual(await fetchExifUsingExifr(filePath), null);
    assert.strictEqual(await fetchExifUsingExifr(filePath), null);

    const [reason, ...others] = exifReadFailures.reasons;
    assert.deepStrictEqual(others, []);
    assert.strictEqual(reason.files, 2);
    assert.match(reason.reason, /^read-failed: /);
    assert(!reason.reason.includes('Kyoto'), reason.reason);
    assert(!reason.reason.includes(directory), reason.reason);
  });
});

describe('ExifFetcher', () => {
  describe('generatePathExifPairs', () => {
    let pathExifPairs: PathExifPair[];

    before(async () => {
      const directoryTreeObject = createDirectoryTree(testResourceDirectory);
      assert(!!directoryTreeObject === true);
      pathExifPairs = await ExifFetcher.generatePathExifPairs(directoryTreeObject);
    });

    it('should generate PathExifPairs', () => {
      assert(pathExifPairs.length !== 0);
    });

    it('should return GPS info for actual-photos/Kobe/IMG_4676.JPG', () => {
      const IMG_4676_path = path.join(testResourceDirectory, 'actual-photos', 'Kobe', 'IMG_4676.JPG');
      const IMG_4676_pathExifPair = pathExifPairs.find(pair => pair.path === IMG_4676_path);
      assert(!!IMG_4676_pathExifPair === true);

      const actual_IMG_4676_latitude = IMG_4676_pathExifPair.exif.gpsInfo.latLng.latitude;
      const expected_IMG_4676_latitude = 34.688075;
      assert(nearlyEqual(actual_IMG_4676_latitude, expected_IMG_4676_latitude, 1.0e-5));

      const actual_IMG_4676_longitude = IMG_4676_pathExifPair.exif.gpsInfo.latLng.longitude;
      const expected_IMG_4676_longitude = 135.19586111111113;
      assert(nearlyEqual(actual_IMG_4676_longitude, expected_IMG_4676_longitude, 1.0e-5));
    });

    // This test is added to check if negative latitude value is gotten when GPSLatitudeRef is "S" (not "N").
    it('should return GPS info for actual-photos/Gold Coast/IMG_1579.JPG', () => {
      const IMG_1579_path = path.join(testResourceDirectory, 'actual-photos', 'Gold Coast', 'IMG_1579.JPG');
      const IMG_1579_pathExifPair = pathExifPairs.find(pair => pair.path === IMG_1579_path);
      assert(!!IMG_1579_pathExifPair === true);

      const actual_IMG_1579_latitude = IMG_1579_pathExifPair.exif.gpsInfo.latLng.latitude;
      const expected_IMG_1579_latitude = -28.006441666666667;    // Negative value because GPSLatitudeRef is "S".
      assert(nearlyEqual(actual_IMG_1579_latitude, expected_IMG_1579_latitude, 1.0e-5));

      const actual_IMG_1579_longitude = IMG_1579_pathExifPair.exif.gpsInfo.latLng.longitude;
      const expected_IMG_1579_longitude = 153.42967222222222;
      assert(nearlyEqual(actual_IMG_1579_longitude, expected_IMG_1579_longitude, 1.0e-5));
    });

    // This test is added to check if negative longitude value is gotten when GPSLongitudeRef is "W" (not "E").
    it('should return GPS info for actual-photos/Apple Park/IMG_5769.JPG', () => {
      const IMG_5769_path = path.join(testResourceDirectory, 'actual-photos', 'Apple Park', 'IMG_5769.JPG');
      const IMG_5769_pathExifPair = pathExifPairs.find(pair => pair.path === IMG_5769_path);
      assert(!!IMG_5769_pathExifPair === true);

      const actual_IMG_5769_latitude = IMG_5769_pathExifPair.exif.gpsInfo.latLng.latitude;
      const expected_IMG_5769_latitude = 37.33255833333334;
      assert(nearlyEqual(actual_IMG_5769_latitude, expected_IMG_5769_latitude, 1.0e-5));

      const actual_IMG_5769_longitude = IMG_5769_pathExifPair.exif.gpsInfo.latLng.longitude;
      const expected_IMG_5769_longitude = -122.00566111111111;    // Negative value because GPSLongitudeRef is "W".
      assert(nearlyEqual(actual_IMG_5769_longitude, expected_IMG_5769_longitude, 1.0e-5));
    });

    // Windows Photo Viewer turned the pixels of the photo in actual-photos/Unga, of which the other file is a copy without
    // its location, and left its thumbnail as it was. The cameras' portrait photos say so by their orientation, which
    // turns their thumbnails too.
    it('should find the EXIF thumbnail on its side only where an app turned the photo\'s pixels without it', () => {
      const onItsSide = (...segments: string[]) => {
        const pair = pathExifPairs.find(candidate => candidate.path === path.join(testResourceDirectory, 'actual-photos', ...segments));
        assert(pair?.exif?.thumbnail && pair.exif.imageDimensions, `${segments.join('/')} has a thumbnail and a size`);
        return isExifThumbnailOnItsSide(pair.exif);
      };
      assert.strictEqual(onItsSide('Unga', 'IMG_2581.JPG'), true);
      assert.strictEqual(onItsSide('Unga', 'IMG_2581_WithoutGpsInfo.JPG'), true);
      assert.strictEqual(onItsSide('Kobe', 'IMG_4676.JPG'), false);
      assert.strictEqual(onItsSide('Apple Park', 'IMG_5769.JPG'), false);
      assert.strictEqual(onItsSide('Gold Coast', 'IMG_1579.JPG'), false);
    });

    it('should return null for unsupported-files/Invalid Photo.JPG', () => {
      const Invalid_Photo_path = path.join(testResourceDirectory, 'unsupported-files', 'Invalid Photo.JPG');
      const Invalid_Photo_pathExifPair = pathExifPairs.find(pair => pair.path === Invalid_Photo_path);
      assert(!!Invalid_Photo_pathExifPair === true);
      assert(Invalid_Photo_pathExifPair.exif === null);
    });
  });
});

