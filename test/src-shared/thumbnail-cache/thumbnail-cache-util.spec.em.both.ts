import assert = require('assert');
import * as os from 'os';
import {
  getOriginalFilePath,
  getThumbnailFilePath,
  getThumbnailLogFilePath,
  plmThumbnailCacheDir
} from '../../../src-shared/thumbnail-cache/thumbnail-cache-util';

describe('ThumbnailCacheUtil', () => {
  describe('getThumbnailFilePath should return the thumbnail file path from the original file path', () => {
    if (os.platform() === 'win32') {
      it('on Windows', () => {
        const originalFilePath = 'C:\\Users\\Tomoyuki\\Desktop\\IMG_100.HEIC';
        const { thumbnailFileDir: actualThumbnailFileDir,
                thumbnailFilePath: actualThumbnailFilePath } = getThumbnailFilePath(originalFilePath);
        const expectedThumbnailFileDir = `${plmThumbnailCacheDir}\\C\\Users\\Tomoyuki\\Desktop`;
        const expectedThumbnailFilePath = `${plmThumbnailCacheDir}\\C\\Users\\Tomoyuki\\Desktop\\IMG_100.HEIC.plm.jpg`;
        assert.equal(actualThumbnailFileDir, expectedThumbnailFileDir);
        assert.equal(actualThumbnailFilePath, expectedThumbnailFilePath);
      });
    }

    if (os.platform() === 'darwin' || os.platform() === 'linux') {
      it('on macOS or Linux', () => {
        const originalFilePath = '/Users/Tomoyuki/Desktop/IMG_100.HEIC';
        const { thumbnailFileDir: actualThumbnailFileDir,
          thumbnailFilePath: actualThumbnailFilePath } = getThumbnailFilePath(originalFilePath);
        const expectedThumbnailFileDir = `${plmThumbnailCacheDir}/Users/Tomoyuki/Desktop`;
        const expectedThumbnailFilePath = `${plmThumbnailCacheDir}/Users/Tomoyuki/Desktop/IMG_100.HEIC.plm.jpg`;
        assert.equal(actualThumbnailFileDir, expectedThumbnailFileDir);
        assert.equal(actualThumbnailFilePath, expectedThumbnailFilePath);
      });
    }
  });

  describe('getThumbnailLogFilePath should return the thumbnail log file path from the original file path', () => {
    if (os.platform() === 'win32') {
      it('on Windows', () => {
        const originalFilePath = 'C:\\Users\\Tomoyuki\\Desktop\\IMG_100.HEIC';
        const actualThumbnailLogFilePath = getThumbnailLogFilePath(originalFilePath);
        const expectedThumbnailLogFilePath = `${plmThumbnailCacheDir}\\C\\Users\\Tomoyuki\\Desktop\\IMG_100.HEIC.log.json`;
        assert.equal(actualThumbnailLogFilePath, expectedThumbnailLogFilePath);
      });
    }

    if (os.platform() === 'darwin' || os.platform() === 'linux') {
      it('on macOS or Linux', () => {
        const originalFilePath = '/Users/Tomoyuki/Desktop/IMG_100.HEIC';
        const actualThumbnailLogFilePath = getThumbnailLogFilePath(originalFilePath);
        const expectedThumbnailLogFilePath = `${plmThumbnailCacheDir}/Users/Tomoyuki/Desktop/IMG_100.HEIC.log.json`;
        assert.equal(actualThumbnailLogFilePath, expectedThumbnailLogFilePath);
      });
    }
  });

  describe('getOriginalFilePath should return the original file path from the thumbnail file path', () => {
    if (os.platform() === 'win32') {
      it('on Windows', () => {
        const thumbnailFilePath = `${plmThumbnailCacheDir}\\C\\Users\\Tomoyuki\\Desktop\\IMG_100.HEIC.plm.jpg`;
        const actualOriginalFilePath = getOriginalFilePath(thumbnailFilePath);
        const expectedOriginalFilePath = 'C:\\Users\\Tomoyuki\\Desktop\\IMG_100.HEIC';
        assert.equal(actualOriginalFilePath, expectedOriginalFilePath);
      });
    }

    if (os.platform() === 'darwin' || os.platform() === 'linux') {
      it('on macOS or Linux', () => {
        const thumbnailFilePath = `${plmThumbnailCacheDir}/Users/Tomoyuki/Desktop/IMG_100.HEIC.plm.jpg`;
        const actualOriginalFilePath = getOriginalFilePath(thumbnailFilePath);
        const expectedOriginalFilePath = '/Users/Tomoyuki/Desktop/IMG_100.HEIC';
        assert.equal(actualOriginalFilePath, expectedOriginalFilePath);
      });
    }
  });

  describe('Applying getThumbnailFilePath and then getOriginalFilePath should result in the original file path', () => {
    if (os.platform() === 'win32') {
      it('on Windows', () => {
        const expectedOriginalFilePath = 'C:\\Users\\Tomoyuki\\Desktop\\IMG_100.HEIC';
        const { thumbnailFilePath } = getThumbnailFilePath(expectedOriginalFilePath);
        const actualOriginalFilePath = getOriginalFilePath(thumbnailFilePath);
        assert.equal(actualOriginalFilePath, expectedOriginalFilePath);
      });
    }

    if (os.platform() === 'darwin' || os.platform() === 'linux') {
      it('on macOS or Linux', () => {
        const expectedOriginalFilePath = '/Users/Tomoyuki/Desktop/IMG_100.HEIC';
        const { thumbnailFilePath } = getThumbnailFilePath(expectedOriginalFilePath);
        const actualOriginalFilePath = getOriginalFilePath(thumbnailFilePath);
        assert.equal(actualOriginalFilePath, expectedOriginalFilePath);
      });
    }
  });

  describe('Applying getOriginalFilePath and then getThumbnailFilePath should result in the thumbnail file path', () => {
    if (os.platform() === 'win32') {
      it('on Windows', () => {
        const expectedThumbnailFilePath = `${plmThumbnailCacheDir}\\C\\Users\\Tomoyuki\\Desktop\\IMG_100.HEIC.plm.jpg`;
        const originalFilePath = getOriginalFilePath(expectedThumbnailFilePath);
        const actual = getThumbnailFilePath(originalFilePath);
        assert.equal(actual.thumbnailFilePath, expectedThumbnailFilePath);
      });
    }

    if (os.platform() === 'darwin' || os.platform() === 'linux') {
      it('on macOS or Linux', () => {
        const expectedThumbnailFilePath = `${plmThumbnailCacheDir}/Users/Tomoyuki/Desktop/IMG_100.HEIC.plm.jpg`;
        const originalFilePath = getOriginalFilePath(expectedThumbnailFilePath);
        const actual = getThumbnailFilePath(originalFilePath);
        assert.equal(actual.thumbnailFilePath, expectedThumbnailFilePath);
      });
    }
  });
});
