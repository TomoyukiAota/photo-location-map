import assert = require('assert');
import * as path from 'path';
import * as createDirectoryTree from 'directory-tree';
import { DirTreeObjectRecorder } from '../../../src-shared/dir-tree-object-recorder/dir-tree-object-recorder';

const testResourceDirectory = path.join(__dirname, '..', '..', 'test-resources', 'dir-tree-object-recorder-test-resource');

describe('DirTreeObjectRecorder', () => {
  it('getNumbersToRecord should return numbers to record from DirectoryTree object', () => {
    // Arrange
    const directoryTreeObject = createDirectoryTree(testResourceDirectory);

    // Act
    const numberOf = DirTreeObjectRecorder.getNumbersToRecord(directoryTreeObject);

    // Assert
    assert(numberOf.totalItems === 24);
    assert(numberOf.directories === 9);
    assert(numberOf.files === 15);

    assert(numberOf.photos.total === (7 + 2 + 3));
    assert(numberOf.photos.jpeg === 7);
    assert(numberOf.photos.tiff === 2);
    assert(numberOf.photos.heif === 3);

    assert(numberOf.livePhotos.total === (1 + 1));
    assert(numberOf.livePhotos.jpeg === 1);
    assert(numberOf.livePhotos.heif === 1);
  });
});
