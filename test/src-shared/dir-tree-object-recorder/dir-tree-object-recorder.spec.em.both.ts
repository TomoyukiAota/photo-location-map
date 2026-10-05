import assert = require('assert');
import * as createDirectoryTree from 'directory-tree';
import * as fsExtra from 'fs-extra';
import * as path from 'path';
import { DirTreeObjectRecorder } from '../../../src-shared/dir-tree-object-recorder/dir-tree-object-recorder';
import { convertToFlattenedDirTree } from '../../../src-shared/dir-tree/dir-tree-util';


describe('DirTreeObjectRecorder', () => {
  it('getNumbersToRecord should handle files in dir-tree-object-recorder-test-resource folder', () => {
    // Arrange
    const testResourceDirectory = path.join(__dirname, '..', '..', 'test-resources', 'dir-tree-object-recorder-test-resource');
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
  });

  it('getNumbersToRecord should handle an empty folder', () => {
    // Arrange
    const emptyDirectory = path.join(__dirname, '..', '..', 'test-resources', 'empty-folder');
    fsExtra.ensureDirSync(emptyDirectory);
    const dirTreeObject = createDirectoryTree(emptyDirectory);
    const flattenedDirTree = convertToFlattenedDirTree(dirTreeObject);

    // Act
    const numberOf = DirTreeObjectRecorder.getNumbersToRecord(flattenedDirTree);

    // Assert
    assert.equal(numberOf.totalItems, 1);
    assert.equal(numberOf.directories, 1);
    assert.equal(numberOf.files, 0);

    assert.equal(numberOf.photos.jpeg, 0);
    assert.equal(numberOf.photos.tiff, 0);
    assert.equal(numberOf.photos.png, 0);
    assert.equal(numberOf.photos.heif, 0);
    assert.equal(numberOf.photos.webp, 0);
    assert.equal(numberOf.photos.total, 0);
    assert.equal(numberOf.photos.supportedPercentage, 'N/A (No photos loaded)');

    assert.equal(numberOf.livePhotos.jpeg, 0);
    assert.equal(numberOf.livePhotos.heif, 0);
    assert.equal(numberOf.livePhotos.total, 0);
  });

  it('getFileCountsByExtension should count every file by its extension as written', () => {
    // Arrange
    const testResourceDirectory = path.join(__dirname, '..', '..', 'test-resources', 'dir-tree-object-recorder-test-resource');
    const flattenedDirTree = convertToFlattenedDirTree(createDirectoryTree(testResourceDirectory));

    // Act
    const counts = DirTreeObjectRecorder.getFileCountsByExtension(flattenedDirTree);

    // Assert
    const total = Array.from(counts.values()).reduce((sum, count) => sum + count, 0);
    assert.equal(total, 17);  // Every file, as in numberOf.files above.
    assert.ok(Array.from(counts.keys()).every(extension => !extension.startsWith('.')));
    assert.equal(counts.get('webp'), 1);
    assert.equal(counts.get('MOV'), 2);  // Case is kept: "Live Photos.MOV".
    assert.equal(counts.get('JPG'), 1);
    assert.equal(counts.get('jpg'), 1);
    assert.equal(counts.get('mov'), undefined);
  });
});
