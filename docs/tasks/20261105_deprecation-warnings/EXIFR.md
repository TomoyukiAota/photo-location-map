# exifr file-handle cleanup

## Confirmed cause

The original Electron renderer test run emitted DEP0137 and multiple warnings
about file descriptors closed by garbage collection. exifr 7.1.3's source has three
confirmed paths that skip its normal reader close:

- `Exifr.extractThumbnail()` returns early when a PNG/HEIC or JPEG lacks a TIFF
  segment.
- `Exifr.parse()` can throw during setup, before reaching its normal close.
- `Exifr.read()` assigns its reader only after the reader finishes the initial
  I/O. A failed initial `stat` or `read` therefore leaves an opened handle
  inaccessible through the parser.

Deterministic reproduction under Electron's Node 24.22.1 instrumented
`fs.promises.open` and each returned handle's `close`: extracting a thumbnail from
a synthetic PNG without EXIF and parsing a synthetic one-byte malformed JPEG
both left their handles open. The reproduction explicitly closed these handles
after recording the result; no GC timing was needed.

## Narrow workaround

`electron-util/managed-exifr.cjs` wraps the two operations used by the renderer.
It creates the same public `Exifr` class and uses the exact exported thumbnail
defaults. For filesystem paths, it constructs the same registered filesystem
reader with the parser's normalized options and assigns that per-call reader
before starting I/O. The dispatch exactly preserves upstream handling for
`data:` strings, base64 strings longer than 10000 characters, URLs containing
`://`, and non-string inputs. No registry entry is changed.
Each operation closes its per-call reader in `finally`, and awaits a
memoized close promise when upstream starts closing without awaiting it. The
existing remote-require hook returns this adapter for the existing `exifr` name.
Other exports and direct library callers remain unchanged. No global library
registry or prototype is modified.

This preserves chunked file reading, main-process execution, parser options,
metadata, thumbnail bytes, and the original parsing error if cleanup also fails.
The per-instance reader's `file`/`options` properties and exported thumbnail defaults exist
in the pinned library but are absent from its declarations; their type casts
are deliberately confined to this helper.

Reading whole photos into buffers was rejected because it would increase memory
and I/O. A decoder/library upgrade was unnecessary for a resource ownership bug
and could change metadata or thumbnail behavior. The inline workaround comment
contains the required `TL;DR:` / `Details:` explanation.

## Validation

- The original TypeScript implementation passed main-process type checking;
  the final CommonJS helper uses JSDoc types and is included in
  `tsconfig.build-config.json`'s `checkJs` validation.
- Final `mise exec -- node_modules/.bin/tsc -p tsconfig.build-config.json`:
  passed. Direct focused Mocha execution with Electron's Node runtime,
  `ELECTRON_RUN_AS_NODE=1 TS_NODE_TRANSPILE_ONLY=1 TS_NODE_PROJECT=test/em-main.tsconfig.json node_modules/.bin/electron node_modules/mocha/bin/mocha.js --require ts-node/register test/src-main/exif/managed-exifr.spec.em.main.ts`:
  the initial four tests passed (11 ms), with no GC/deprecation warnings. The
  expanded seven-test suite also passed under the same Electron runtime.
- Added focused Electron-main tests using real file handles: early thumbnail
  return with a large image (and bounded bytes read), malformed parse failure,
  exact original metadata/thumbnail equality, and parse-error preservation when
  cleanup fails. Additional tests inject initial stat/read failures on real file
  handles, preserve the original error when close also fails, and verify buffers,
  data URLs, and long base64 strings retain their original readers and results.
  Integrated test outcomes belong in `PLAN.md`.
- The initial helper was a compiled main-process TypeScript entry. Integrated
  E2E launches encountered a missing generated helper when its hook was loaded
  before compilation. This was an integration ordering error, not an application
  behavior regression. The final helper is a tracked CommonJS source under
  `electron-util`, available immediately after installation and included in the
  existing package files. Standalone unit tests need no additional build step.
- Host Node 26 rejects exifr's legacy `fh.stat(path)` argument; Electron uses
  Node 24 and does not reproduce that compatibility failure. The adapter preserves
  such read errors while closing the file rather than changing the library's
  filesystem API behavior.
