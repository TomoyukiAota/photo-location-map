import { addExifFileTime, exifPerfStats, exifSummaryLine, resetExifPerfStats } from './exif-perf-stats.js';

describe('exifSummaryLine', () => {
  beforeEach(() => resetExifPerfStats());

  it('says how many files were read, in how long, where the time went and which file took the longest', () => {
    addExifFileTime('/photos/a.jpg', 12.4);
    addExifFileTime('/photos/b b.jpg', 30.6);
    addExifFileTime('/photos/c.jpg', 20);
    Object.assign(exifPerfStats, { readMs: 50.2, parseMs: 20.4, thumbnailMs: 5.5, rotateMs: 9.4 });

    expect(exifPerfStats.files).toBe(3);
    expect(exifPerfStats.maxFileMs).toBe(30.6);
    expect(exifSummaryLine(41.7, 10)).toBe('[using exifr] Read the EXIF of 3 files in 42 ms, 10 at a time. '
      + 'Sums of their times: reading 50 ms (of which parsing 20 ms and thumbnails 6 ms in the main process), '
      + 'rotating 9 ms. The slowest file took 31 ms: "/photos/b b.jpg"');
  });

  it('names no file for a folder without photos, nor one of the folder before', () => {
    addExifFileTime('/photos/a.jpg', 12);
    resetExifPerfStats();

    expect(exifSummaryLine(0.4, 10)).toBe('[using exifr] Read the EXIF of 0 files in 0 ms, 10 at a time.');
  });
});
