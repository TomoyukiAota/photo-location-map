import assert = require('assert');
import * as path from 'path';
import * as createDirectoryTree from 'directory-tree';
import { ExifFetcher } from '../../../../src/app/shared/exif-fetcher';

describe('ExifFetcher', () => {
  it('should create PathExifPair from DirectoryTree object', () => {
    const testResourceDirectory = path.join(__dirname, '..', '..', '..', 'test-resources');
    const directoryTreeObject = createDirectoryTree(testResourceDirectory);
    assert(!!directoryTreeObject.path === true);
    assert(window.process.type === 'renderer');

    // TODO: Add tests which assert the condition described in the test expectation.
  });
});

