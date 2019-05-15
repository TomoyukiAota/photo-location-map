import assert = require('assert');
import * as createDirectoryTree from 'directory-tree';
import { ExifFetcher } from '../../../../src/app/shared/exif-fetcher';

describe('ExifFetcher', () => {
  it('should create PathExifPair from DirectoryTree object', () => {
    const directoryTreeObject = createDirectoryTree('C:\\GitRepo\\GitHub\\TomoyukiAota\\photo-location-map\\test\\test-resources');
    assert(!!directoryTreeObject.path === true);
    assert(window.process.type === 'renderer');

    // TODO: Add tests which assert the condition described in the test expectation.
  });
});

