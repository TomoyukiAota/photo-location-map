import exifrModule from 'exifr';

// exifr is CommonJS, so its default import is its module.exports, which holds every export of its declarations. Its
// declarations' default export types Exifr as an instance rather than the class, so it is typed as the module.
const exifr = /** @type {typeof import('exifr')} */ (/** @type {unknown} */ (exifrModule));

/** @typedef {Parameters<typeof exifr.parse>[0]} Input */
/** @typedef {Parameters<typeof exifr.parse>[1]} Options */
/** @typedef {import('exifr').Exifr & {options: unknown, file?: {close?(): void | Promise<void>}}} FileBackedExifr */

// TL;DR: Close exifr's per-call file reader in finally, including early returns/errors.
// Details: exifr 7.1.3's extractThumbnail returns without closing when a PNG/HEIC
// has no TIFF segment; parse can also throw before reaching its close call. Its
// read method assigns the reader only after reading, hiding an open handle when
// stat/read fails. All three paths leave FileHandles for GC, producing DEP0137.
// Keep the existing main-process, chunked reader and options: reading whole photos into buffers would increase
// memory/I/O, and changing decoders would risk metadata/thumbnail compatibility.
// The file/options properties are present in exifr's implementation but absent
// from its declarations. This wrapper changes only reader ownership, not parser behavior.
/**
 * @template T
 * @param {Input} input
 * @param {Options} options
 * @param {(parser: import('exifr').Exifr) => Promise<T>} operation
 * @returns {Promise<T>}
 */
async function withClosedReader(input, options, operation) {
  const parser = /** @type {FileBackedExifr} */ (new exifr.Exifr(
    /** @type {ConstructorParameters<typeof exifr.Exifr>[0]} */ (options),
  ));
  let failed = false;
  try {
    // Match exifr's Node readString dispatch: data/long base64 strings and URLs
    // retain its normal readers. Own only the filesystem reader before I/O starts.
    const isFilesystemPath = typeof input === 'string' && !input.startsWith('data:')
      && input.length <= 10000 && !input.includes('://');
    const FsReader = isFilesystemPath ? exifr.fileReaders.get('fs') : undefined;
    if (FsReader) {
      const reader = new FsReader(input, parser.options);
      parser.file = reader;
      shareClosePromise(reader);
      await reader.read();
    } else {
      await parser.read(input);
      shareClosePromise(parser.file);
    }
    return await operation(parser);
  } catch (error) {
    failed = true;
    throw error;
  } finally {
    try {
      await parser.file?.close?.();
    } catch (error) {
      if (!failed) throw error;
    }
  }
}

/** @param {FileBackedExifr['file']} reader */
function shareClosePromise(reader) {
  if (!reader?.close) return;
  const close = reader.close.bind(reader);
  /** @type {Promise<void> | undefined} */
  let closing;
  // Upstream does not await close. Share its in-flight close with our finally.
  reader.close = () => closing ??= Promise.resolve(close());
}

/**
 * @param {Input} input
 * @param {Options} [options]
 * @returns {Promise<any>}
 */
async function parse(input, options) {
  return withClosedReader(input, options, parser => parser.parse());
}

/**
 * @param {Input} input
 * @returns {Promise<Buffer | undefined>}
 */
async function thumbnail(input) {
  // The library exports these exact defaults, although its declarations omit them.
  const { thumbnailOnlyOptions } = /** @type {typeof exifr & {thumbnailOnlyOptions: Options}} */ (exifr);
  return withClosedReader(input, thumbnailOnlyOptions, async parser => {
    const bytes = await parser.extractThumbnail();
    return bytes ? Buffer.from(bytes) : undefined;
  });
}

/** @type {Omit<typeof exifr, 'parse' | 'thumbnail'> & {parse: typeof parse, thumbnail: typeof thumbnail}} */
export const managedExifr = { ...exifr, parse, thumbnail };
