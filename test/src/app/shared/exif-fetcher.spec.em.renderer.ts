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

    it('should return null for unsupported-files/Invalid Photo.JPG', () => {
      const Invalid_Photo_path = path.join(testResourceDirectory, 'unsupported-files', 'Invalid Photo.JPG');
      const Invalid_Photo_pathExifPair = pathExifPairs.find(pair => pair.path === Invalid_Photo_path);
      assert(!!Invalid_Photo_pathExifPair === true);
      assert(Invalid_Photo_pathExifPair.exif === null);
    });
  });
});

