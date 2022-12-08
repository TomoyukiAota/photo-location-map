import assert = require('assert');
import * as os from 'os';
import {
  getOriginalFilePath,
  getThumbnailFilePath,
  getThumbnailLogFilePath,
  plmThumbnailCacheDir
} from '../../../src-shared/thumbnail/cache/thumbnail-cache-util';

describe('ThumbnailCacheUtil', () => {
  describe('getThumbnailFilePath should return the thumbnail file path from the original file path', () => {
    function runTest(originalFilePath: string, expectedThumbnailFileDir: string, expectedThumbnailFilePath: string) {
      const {
        thumbnailFileDir: actualThumbnailFileDir,
        thumbnailFilePath: actualThumbnailFilePath
      } = getThumbnailFilePath(originalFilePath);
      assert.equal(actualThumbnailFileDir, expectedThumbnailFileDir);
      assert.equal(actualThumbnailFilePath, expectedThumbnailFilePath);
    }

    if (os.platform() === 'win32') {
      const testCases = [
        {
          originalFilePath: 'C:\\Users\\Tomoyuki\\Desktop\\IMG_100.HEIC',
          expectedThumbnailFileDir: `${plmThumbnailCacheDir}\\D_C\\Users\\Tomoyuki\\Desktop`,
          expectedThumbnailFilePath: `${plmThumbnailCacheDir}\\D_C\\Users\\Tomoyuki\\Desktop\\IMG_100.HEIC.plm.jpg`
        },
        {
          originalFilePath: '\\\\Hostname\\Folder\\IMG_100.HEIC',
          expectedThumbnailFileDir: `${plmThumbnailCacheDir}\\H_Hostname\\Folder`,
          expectedThumbnailFilePath: `${plmThumbnailCacheDir}\\H_Hostname\\Folder\\IMG_100.HEIC.plm.jpg`
        },
      ];

      it('on Windows', () => {
        testCases.forEach(({originalFilePath, expectedThumbnailFileDir, expectedThumbnailFilePath}) => {
          runTest(originalFilePath, expectedThumbnailFileDir, expectedThumbnailFilePath);
        });
      });
    }

    if (os.platform() === 'darwin' || os.platform() === 'linux') {
      it('on macOS or Linux', () => {
        const testCases = [
          {
            originalFilePath: '/Users/Tomoyuki/Desktop/IMG_100.HEIC',
            expectedThumbnailFileDir: `${plmThumbnailCacheDir}/Users/Tomoyuki/Desktop`,
            expectedThumbnailFilePath: `${plmThumbnailCacheDir}/Users/Tomoyuki/Desktop/IMG_100.HEIC.plm.jpg`
          },
          {
            originalFilePath: '/Volumes/VolumeName/Folder/IMG_100.HEIC',
            expectedThumbnailFileDir: `${plmThumbnailCacheDir}/Volumes/VolumeName/Folder`,
            expectedThumbnailFilePath: `${plmThumbnailCacheDir}/Volumes/VolumeName/Folder/IMG_100.HEIC.plm.jpg`
          },
        ];

        testCases.forEach(({originalFilePath, expectedThumbnailFileDir, expectedThumbnailFilePath}) => {
          runTest(originalFilePath, expectedThumbnailFileDir, expectedThumbnailFilePath);
        });
      });
    }
  });

  describe('getThumbnailLogFilePath should return the thumbnail log file path from the original file path', () => {
    function runTest(originalFilePath: string, expectedThumbnailLogFilePath: string) {
      const actualThumbnailLogFilePath = getThumbnailLogFilePath(originalFilePath);
      assert.equal(actualThumbnailLogFilePath, expectedThumbnailLogFilePath);
    }

    if (os.platform() === 'win32') {
      const testCases = [
        {
          originalFilePath: 'C:\\Users\\Tomoyuki\\Desktop\\IMG_100.HEIC',
          expectedThumbnailLogFilePath: `${plmThumbnailCacheDir}\\D_C\\Users\\Tomoyuki\\Desktop\\IMG_100.HEIC.log.json`
        },
        {
          originalFilePath: '\\\\Hostname\\Folder\\IMG_100.HEIC',
          expectedThumbnailLogFilePath: `${plmThumbnailCacheDir}\\H_Hostname\\Folder\\IMG_100.HEIC.log.json`
        },
      ];

      it('on Windows', () => {
        testCases.forEach(({originalFilePath, expectedThumbnailLogFilePath}) => runTest(originalFilePath, expectedThumbnailLogFilePath));
      });
    }

    if (os.platform() === 'darwin' || os.platform() === 'linux') {
      const testCases = [
        {
          originalFilePath: '/Users/Tomoyuki/Desktop/IMG_100.HEIC',
          expectedThumbnailLogFilePath: `${plmThumbnailCacheDir}/Users/Tomoyuki/Desktop/IMG_100.HEIC.log.json`
        },
        {
          originalFilePath: '/Volumes/VolumeName/Folder/IMG_100.HEIC',
          expectedThumbnailLogFilePath: `${plmThumbnailCacheDir}/Volumes/VolumeName/Folder/IMG_100.HEIC.log.json`
        },
      ];

      it('on macOS or Linux', () => {
        testCases.forEach(({originalFilePath, expectedThumbnailLogFilePath}) => runTest(originalFilePath, expectedThumbnailLogFilePath));
      });
    }
  });

  describe('getOriginalFilePath should return the original file path from the thumbnail file path', () => {
    function runTest(thumbnailFilePath: string, expectedOriginalFilePath: string) {
      const actualOriginalFilePath = getOriginalFilePath(thumbnailFilePath);
      assert.equal(actualOriginalFilePath, expectedOriginalFilePath);
    }

    if (os.platform() === 'win32') {
      const testCases = [
        {
          thumbnailFilePath: `${plmThumbnailCacheDir}\\D_C\\Users\\Tomoyuki\\Desktop\\IMG_100.HEIC.plm.jpg`,
          expectedOriginalFilePath: 'C:\\Users\\Tomoyuki\\Desktop\\IMG_100.HEIC'
        },
        {
          thumbnailFilePath: `${plmThumbnailCacheDir}\\H_Hostname\\Folder\\IMG_100.HEIC.plm.jpg`,
          expectedOriginalFilePath: '\\\\Hostname\\Folder\\IMG_100.HEIC'
        },
      ];

      it('on Windows', () => {
        testCases.forEach(({thumbnailFilePath, expectedOriginalFilePath}) => runTest(thumbnailFilePath, expectedOriginalFilePath));
      });
    }

    if (os.platform() === 'darwin' || os.platform() === 'linux') {
      const testCases = [
        {
          thumbnailFilePath: `${plmThumbnailCacheDir}/Users/Tomoyuki/Desktop/IMG_100.HEIC.plm.jpg`,
          expectedOriginalFilePath: '/Users/Tomoyuki/Desktop/IMG_100.HEIC'
        },
        {
          thumbnailFilePath: `${plmThumbnailCacheDir}/Volumes/VolumeName/Folder/IMG_100.HEIC.plm.jpg`,
          expectedOriginalFilePath: '/Volumes/VolumeName/Folder/IMG_100.HEIC'
        },
      ];

      it('on macOS or Linux', () => {
        testCases.forEach(({thumbnailFilePath, expectedOriginalFilePath}) => runTest(thumbnailFilePath, expectedOriginalFilePath));
      });
    }
  });

  describe('Applying getThumbnailFilePath and then getOriginalFilePath should result in the original file path', () => {
    function runTest(expectedOriginalFilePath: string) {
      const {thumbnailFilePath} = getThumbnailFilePath(expectedOriginalFilePath);
      const actualOriginalFilePath = getOriginalFilePath(thumbnailFilePath);
      assert.equal(actualOriginalFilePath, expectedOriginalFilePath);
    }

    if (os.platform() === 'win32') {
      const testCases = [
        { expectedOriginalFilePath: 'C:\\Users\\Tomoyuki\\Desktop\\IMG_100.HEIC' },
        { expectedOriginalFilePath: '\\\\Hostname\\Folder\\IMG_100.HEIC' },
      ];

      it('on Windows', () => {
        testCases.forEach(({expectedOriginalFilePath}) => runTest(expectedOriginalFilePath));
      });
    }

    if (os.platform() === 'darwin' || os.platform() === 'linux') {
      const testCases = [
        { expectedOriginalFilePath: '/Users/Tomoyuki/Desktop/IMG_100.HEIC' },
        { expectedOriginalFilePath: '/Volumes/VolumeName/Folder/IMG_100.HEIC' },
      ];

      it('on macOS or Linux', () => {
        testCases.forEach(({expectedOriginalFilePath}) => runTest(expectedOriginalFilePath));
      });
    }
  });

  describe('Applying getOriginalFilePath and then getThumbnailFilePath should result in the thumbnail file path', () => {
    function runTest(expectedThumbnailFilePath: string) {
      const originalFilePath = getOriginalFilePath(expectedThumbnailFilePath);
      const actual = getThumbnailFilePath(originalFilePath);
      assert.equal(actual.thumbnailFilePath, expectedThumbnailFilePath);
    }

    if (os.platform() === 'win32') {
      const testCases = [
        { expectedThumbnailFilePath: `${plmThumbnailCacheDir}\\D_C\\Users\\Tomoyuki\\Desktop\\IMG_100.HEIC.plm.jpg` },
        { expectedThumbnailFilePath: `${plmThumbnailCacheDir}\\H_Hostname\\Folder\\IMG_100.HEIC.plm.jpg` },
      ];

      it('on Windows', () => {
        testCases.forEach(({expectedThumbnailFilePath}) => runTest(expectedThumbnailFilePath));
      });
    }

    if (os.platform() === 'darwin' || os.platform() === 'linux') {
      const testCases = [
        { expectedThumbnailFilePath: `${plmThumbnailCacheDir}/Users/Tomoyuki/Desktop/IMG_100.HEIC.plm.jpg` },
        { expectedThumbnailFilePath: `${plmThumbnailCacheDir}/Volumes/VolumeName/Folder/IMG_100.HEIC.plm.jpg` },
      ];

      it('on macOS or Linux', () => {
        testCases.forEach(({expectedThumbnailFilePath}) => runTest(expectedThumbnailFilePath));
      });
    }
  });
});
