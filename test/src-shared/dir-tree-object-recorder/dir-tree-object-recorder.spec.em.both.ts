import assert = require('assert');
import * as path from 'path';
import * as createDirectoryTree from 'directory-tree';
import { DirTreeObjectRecorder } from '../../../src-shared/dir-tree-object-recorder/dir-tree-object-recorder';
import { convertToFlattenedDirTree } from '../../../src-shared/dir-tree/dir-tree-util';

const testResourceDirectory = path.join(__dirname, '..', '..', 'test-resources', 'dir-tree-object-recorder-test-resource');

describe('DirTreeObjectRecorder', () => {
  it('getNumbersToRecord should return numbers to record from DirectoryTree object', () => {
    // Arrange
    const dirTreeObject = createDirectoryTree(testResourceDirectory);
    const flattenedDirTree = convertToFlattenedDirTree(dirTreeObject);

    // Act
    const numberOf = DirTreeObjectRecorder.getNumbersToRecord(flattenedDirTree);

    // Assert
    assert.equal(numberOf.totalItems, 28);
    assert.equal(numberOf.directories, 11);
    assert.equal(numberOf.files, 17);

    assert.equal(numberOf.photos.jpeg, 7);
    assert.equal(numberOf.photos.tiff, 2);
    assert.equal(numberOf.photos.png, 1);
    assert.equal(numberOf.photos.heif, 3);
    assert.equal(numberOf.photos.webp, 1);
    assert.equal(numberOf.photos.total, (7 + 2 + 1 + 3 + 1));
    assert.equal(numberOf.photos.supportedPercentage, '71.429');

    assert.equal(numberOf.livePhotos.jpeg, 1);
    assert.equal(numberOf.livePhotos.heif, 1);
    assert.equal(numberOf.livePhotos.total, (1 + 1));
    assert.equal(numberOf.livePhotos.supportedPercentage, '100.000');
  });
});
