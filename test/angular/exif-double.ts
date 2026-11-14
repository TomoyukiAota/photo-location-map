import type { Exif } from '../../src/app/shared/model/exif.model.js';

// Construction tests do not decode files. Real EXIF behavior remains covered
// in Electron-Mocha and the photo-loading Playwright scenarios.
export function fetchExifUsingExifr(_filePath: string): Promise<Exif> {
  throw new Error('EXIF decoding requires the real Electron test environment');
}
