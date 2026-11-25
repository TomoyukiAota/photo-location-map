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
 * How far a read of parseWithRead() goes ahead of what it is asked for, so that the headers of the segments after the
 * EXIF segment, which are small, come in one read of the file.
 */
const readAheadBytes = 4096;

/**
 * Reads the file with `readFile` through the file handle that exifr opened for the parse, then parses as parse() does,
 * and gives what each gave. `readFile` is given `read(offset, length)`, which resolves with that many bytes of the file
 * from `offset`, or with undefined where the file has fewer, or where exifr read it otherwise than with a file handle.
 * TL;DR: So that the main process reads a JPEG's frame header without opening each photo a third time
 * (src-main/exif/read-exif.ts).
 * Details:
 * - Before the parse, which closes the file at its end: a read after it would open the file again, and the close that
 *   shareClosePromise() shares would not close it.
 * - From the bytes that exifr has read, which are its first chunk of the file: 64 KB where `navigator` is defined, as
 *   in the main process of Electron 45, whose Node.js defines it, and which exifr takes for a browser, and 512 bytes
 *   elsewhere (firstChunkSize in exifr's options). The JPEGs of test/test-resources/actual-photos have their frame
 *   headers 10 to 24 KB into the file.
 * - Other bytes through the file handle of exifr's FsReader, a read going ahead by 4 KB, kept until a read past it;
 *   not through readChunk(), which would keep them in the buffer that the parse looks for segments in, which would then
 *   hold what the parse would not have read. The fh, size, available() and getUint8Array() of exifr's reader are in
 *   its implementation, but not in its declarations, as the file and options properties above.
 * - Measured on macOS, November 2026, with 2,000 JPEGs that the system had in its cache, 10 at a time: parse() and
 *   thumbnail() took 74 ms, and 78 ms with the frame headers read so. Read through a file handle of their own, which
 *   opened each file again, they took 99 ms. Opening a file costs more on Windows, where antivirus software looks at it.
 * @template T
 * @param {Input} input
 * @param {Options} options
 * @param {(read: (offset: number, length: number) => Promise<Uint8Array | undefined>) => Promise<T>} readFile
 * @returns {Promise<{output: any, read: T}>}
 */
async function parseWithRead(input, options, readFile) {
  return withClosedReader(input, options, async parser => {
    const file = /** @type {any} */ (/** @type {FileBackedExifr} */ (parser).file);
    /** What the last read of the file gave, from its offset. @type {{offset: number, bytes: Uint8Array} | undefined} */
    let ahead;
    /** @param {number} offset @param {number} length */
    const read = async (offset, length) => {
      const handle = file?.fh;
      if (!handle || typeof file.size !== 'number' || !(offset >= 0 && length > 0) || offset + length > file.size)
        return undefined;
      // What exifr has read already, its first chunk of the file.
      if (file.available(offset, length))
        return Uint8Array.from(file.getUint8Array(offset, length));
      if (!ahead || offset < ahead.offset || offset + length > ahead.offset + ahead.bytes.length) {
        const bytes = new Uint8Array(Math.min(Math.max(length, readAheadBytes), file.size - offset));
        const { bytesRead } = await handle.read(bytes, 0, bytes.length, offset);
        ahead = { offset, bytes: bytes.subarray(0, bytesRead) };
        if (bytesRead < length)
          return undefined;
      }
      return ahead.bytes.slice(offset - ahead.offset, offset - ahead.offset + length);
    };
    const readResult = await readFile(read);
    return { output: await parser.parse(), read: readResult };
  });
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

/**
 * @type {Omit<typeof exifr, 'parse' | 'thumbnail'>
 *   & {parse: typeof parse, parseWithRead: typeof parseWithRead, thumbnail: typeof thumbnail}}
 */
export const managedExifr = { ...exifr, parse, parseWithRead, thumbnail };
