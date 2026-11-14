import * as path from 'node:path';
import { isAbsolutePath } from './is-absolute-path.js';

describe('isAbsolutePath', () => {
  // Node.js's own answers on each platform, which the renderer, without Node.js, must give.
  const cases = ['/Users/a/photos', 'C:\\photos', 'C:/photos', 'c:\\', '\\\\server\\share\\photos', '\\photos', '/photos',
    'photos', 'photos/a.jpg', '.\\photos', '..', 'C:photos', 'C:', '', '~/photos', '1:\\photos'];

  it('answers as path.win32.isAbsolute on Windows', () => {
    for (const filePath of cases)
      expect(isAbsolutePath(filePath, 'win32'), filePath).toBe(path.win32.isAbsolute(filePath));
  });

  it('answers as path.posix.isAbsolute elsewhere', () => {
    for (const platform of ['darwin', 'linux'])
      for (const filePath of cases)
        expect(isAbsolutePath(filePath, platform), `${platform} ${filePath}`).toBe(path.posix.isAbsolute(filePath));
  });
});
