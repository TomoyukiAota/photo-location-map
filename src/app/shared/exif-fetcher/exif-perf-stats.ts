/**
 * Sums of how long the steps of reading EXIF took while a folder was loaded, which ExifFetcher records as the detail of
 * the `plm:exif:all-done` mark (src-shared/perf/perf-mark.ts). Up to ten files are read at once (ExifFetcher's queue),
 * so the sums add up overlapping times: they say where the time goes, not how long the folder took.
 */
export interface ExifPerfStats {
  /** Files whose EXIF was read. */
  files: number;
  /**
   * The sum of the times to parse EXIF in the main process. Until stage A (@electron/remote), each was a call of the
   * renderer and was timed there, with its IPC; from stage A on, the main process times it, without IPC.
   */
  parseMs: number;
  /** The sum of the times to extract the embedded thumbnail, timed as `parseMs` is. */
  thumbnailMs: number;
  /**
   * From stage A on: the sum of the times of the renderer's one request per photo for both, with its IPC, which
   * compares with stage 0's `parseMs` + `thumbnailMs`. Zero before.
   */
  readMs: number;
  /** The sum of the times to rotate the thumbnails and make the Exif objects, in the renderer. */
  rotateMs: number;
  /** The longest time for one file, from the start of its parse to its Exif object. */
  maxFileMs: number;
}

export const exifPerfStats: ExifPerfStats = { files: 0, parseMs: 0, thumbnailMs: 0, readMs: 0, rotateMs: 0, maxFileMs: 0 };

/**
 * The file that took `maxFileMs`, which the log's summary names (exifSummaryLine). It is kept apart from
 * exifPerfStats, which the mark records, as it is a path of the user's.
 */
let slowestFilePath = '';

/** Starts the sums again, for the next folder. */
export function resetExifPerfStats(): void {
  Object.assign(exifPerfStats, { files: 0, parseMs: 0, thumbnailMs: 0, readMs: 0, rotateMs: 0, maxFileMs: 0 });
  slowestFilePath = '';
}

/** Counts a file whose EXIF was read, which took `fileMs` from the start of its parse to its Exif object. */
export function addExifFileTime(filePath: string, fileMs: number): void {
  exifPerfStats.files++;
  if (fileMs > exifPerfStats.maxFileMs) {
    exifPerfStats.maxFileMs = fileMs;
    slowestFilePath = filePath;
  }
}

/**
 * TL;DR: The log's line for the photos of a folder, once they are read, in place of two lines per photo.
 * Details: Each photo used to log "[using exifr] Fetched EXIF of <path>" and "[using exifr] Created Exif class
 * instance of <path>": for 10,000 photos, 20,000 lines and 6.4 MB of the log. While such a folder opened, they took
 * 18-19% of the main process's CPU, as each line of the renderer, and its console message too, crosses IPC to be
 * written there, and the folder took as long without them (measured on macOS, November 2026). Their objects went to
 * the console only, so the file had the paths alone. A photo that cannot be read still logs a line of its own
 * (using-exifr/fetch-exif-using-exifr.ts).
 */
export function exifSummaryLine(elapsedMs: number, concurrency: number): string {
  const ms = (value: number) => `${Math.round(value)} ms`;
  const { files, readMs, parseMs, thumbnailMs, rotateMs, maxFileMs } = exifPerfStats;
  const summary = `[using exifr] Read the EXIF of ${files} files in ${ms(elapsedMs)}, ${concurrency} at a time.`;
  if (files === 0)
    return summary;
  return `${summary} Sums of their times: reading ${ms(readMs)} (of which parsing ${ms(parseMs)} and thumbnails `
    + `${ms(thumbnailMs)} in the main process), rotating ${ms(rotateMs)}. The slowest file took ${ms(maxFileMs)}: `
    + `"${slowestFilePath}"`;
}
