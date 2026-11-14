import { ExifReadOutput, ExifReadResult } from '../../src-shared/exif/exif-read-result.js';
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
 * Reads the EXIF of a photo and, when it has EXIF, its embedded thumbnail, in the main process.
 * TL;DR: exifr runs here, not in the renderer.
 * Details: With exifr in the renderer, loading was slower, and loading many files failed. The renderer still rotates
 * the thumbnail, which needs the DOM, and builds its Exif model from this result.
 */
export async function readExif(filePath: string): Promise<ExifReadResult> {
  const parseStart = performance.now();
  let output: Record<string, unknown> | undefined;
  try {
    output = await managedExifr.parse(filePath, exifrOptions);
  } catch (error) {
    return { parse: 'failed', error: describe(error) };
  }
  const parseMs = performance.now() - parseStart;
  if (!output) return { parse: 'empty' };

  const thumbnailStart = performance.now();
  try {
    const bytes: Buffer | undefined = await managedExifr.thumbnail(filePath);
    return { parse: 'ok', output: pickOutput(output), thumbnail: bytes ?? null, parseMs, thumbnailMs: performance.now() - thumbnailStart };
  } catch (error) {
    return { parse: 'ok', output: pickOutput(output), thumbnail: null, thumbnailError: describe(error), parseMs,
      thumbnailMs: performance.now() - thumbnailStart };
  }
}
