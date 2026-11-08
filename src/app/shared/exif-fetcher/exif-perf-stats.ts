/**
 * Sums of how long the steps of reading EXIF took while a folder was loaded, which ExifFetcher records as the detail of
 * the `plm:exif:all-done` mark (src-shared/perf/perf-mark.ts). Up to ten files are read at once (ExifFetcher's queue),
 * so the sums add up overlapping times: they say where the time goes, not how long the folder took.
 */
export interface ExifPerfStats {
  /** Files whose EXIF was read. */
  files: number;
  /** The sum of the times to parse EXIF, in the main process, as seen from the renderer. */
  parseMs: number;
  /** The sum of the times to extract the embedded thumbnail, in the main process, as seen from the renderer. */
  thumbnailMs: number;
  /** The sum of the times to rotate the thumbnails and make the Exif objects, in the renderer. */
  rotateMs: number;
  /** The longest time for one file, from the start of its parse to its Exif object. */
  maxFileMs: number;
}

export const exifPerfStats: ExifPerfStats = { files: 0, parseMs: 0, thumbnailMs: 0, rotateMs: 0, maxFileMs: 0 };

/** Starts the sums again, for the next folder. */
export function resetExifPerfStats(): void {
  Object.assign(exifPerfStats, { files: 0, parseMs: 0, thumbnailMs: 0, rotateMs: 0, maxFileMs: 0 });
}
