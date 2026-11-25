import { ExifReadOutput, ExifReadResult } from '../../src-shared/exif/exif-read-result.js';
import { FrameSize, jpegFrameSize, ReadBytes } from '../../src-shared/jpeg/jpeg-segments.js';
// The managed reader closes exifr's file handles on every path.
import { managedExifr } from '../../electron-util/managed-exifr.js';

const exifrOptions = {
  translateValues: false,
  pick: [
    'DateTimeOriginal',
    'ExifImageHeight',
    'ExifImageWidth',
    'GPSLatitude',     // Required for exifrParseOutput.latitude
    'GPSLatitudeRef',  // Required for exifrParseOutput.latitude to be correctly calculated
    'GPSLongitude',    // Required for exifrParseOutput.longitude
    'GPSLongitudeRef', // Required for exifrParseOutput.longitude to be correctly calculated
    'Orientation',
    'Make',            // For analytics: which cameras users shoot with.
  ],
};

/** An error as one line for the log: its name and message, or what was thrown as a string. */
const describe = (error: unknown): string => (error instanceof Error ? `${error.name}: ${error.message}` : String(error));

/** Only the fields the app uses, so that IPC copies no more than it needs. */
function pickOutput(output: Record<string, unknown>): ExifReadOutput {
  const picked: ExifReadOutput = {};
  for (const key of ['DateTimeOriginal', 'ExifImageHeight', 'ExifImageWidth', 'latitude', 'longitude', 'Orientation', 'Make'] as const) {
    if (output[key] !== undefined) (picked as Record<string, unknown>)[key] = output[key];
  }
  return picked;
}

/**
 * The size of a JPEG's frame, read through the file that exifr opened to parse its EXIF data; null for another file,
 * or where the file could not be read, for which the renderer takes the size in the EXIF data.
 */
async function frameSizeOf(read: ReadBytes): Promise<FrameSize | null> {
  try {
    return await jpegFrameSize(read);
  } catch {
    return null;
  }
}

/**
 * Reads the EXIF of a photo and, when it has EXIF, its embedded thumbnail and, for a JPEG, the size of its frame, in
 * the main process.
 * TL;DR: exifr runs here, not in the renderer.
 * Details:
 * - With exifr in the renderer, loading was slower, and loading many files failed. The renderer still rotates the
 *   thumbnail, which needs the DOM, and builds its Exif model from this result.
 * - The frame's size is read through the file that exifr opened for the parse, which `parseMs` counts too
 *   (managedExifr.parseWithRead()): the size of the pixels for certain, against which the renderer checks the
 *   thumbnail's shape (isExifThumbnailOnItsSide in src/app/shared/exif-thumbnail-on-its-side.ts).
 */
export async function readExif(filePath: string): Promise<ExifReadResult> {
  const parseStart = performance.now();
  let output: Record<string, unknown> | undefined;
  let frame: FrameSize | null;
  try {
    ({ output, read: frame } = await managedExifr.parseWithRead(filePath, exifrOptions, frameSizeOf));
  } catch (error) {
    return { parse: 'failed', error: describe(error) };
  }
  const parseMs = performance.now() - parseStart;
  if (!output) return { parse: 'empty' };

  const thumbnailStart = performance.now();
  try {
    const bytes: Buffer | undefined = await managedExifr.thumbnail(filePath);
    return { parse: 'ok', output: pickOutput(output), frame, thumbnail: bytes ?? null, parseMs,
      thumbnailMs: performance.now() - thumbnailStart };
  } catch (error) {
    return { parse: 'ok', output: pickOutput(output), frame, thumbnail: null, thumbnailError: describe(error), parseMs,
      thumbnailMs: performance.now() - thumbnailStart };
  }
}
