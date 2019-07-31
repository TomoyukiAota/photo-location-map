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
    assert(numberOf.totalItems === 9);
    assert(numberOf.directories === 5);
    assert(numberOf.files === 4);
    assert(numberOf.jpegFiles === 2);
    assert(numberOf.livePhotos === 1);
  });
});
