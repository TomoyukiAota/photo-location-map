import assert = require('assert');
import * as path from 'path';
import * as createDirectoryTree from 'directory-tree';
import { nearlyEqual } from '../../../test-util/number-comparison';
import { ExifFetcher, PathExifPair } from '../../../../src/app/shared/exif-fetcher/exif-fetcher';

const testResourceDirectory = path.join(__dirname, '..', '..', '..', 'test-resources');

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

    it('should return null for unsupported-files/Invalid Photo.JPG', () => {
      const Invalid_Photo_path = path.join(testResourceDirectory, 'unsupported-files', 'Invalid Photo.JPG');
      const Invalid_Photo_pathExifPair = pathExifPairs.find(pair => pair.path === Invalid_Photo_path);
      assert(!!Invalid_Photo_pathExifPair === true);
      assert(Invalid_Photo_pathExifPair.exif === null);
    });
  });
});

