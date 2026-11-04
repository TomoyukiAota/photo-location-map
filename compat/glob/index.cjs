const fs = require('node:fs');
const path = require('node:path');
const { EventEmitter } = require('node:events');
const modern = require('glob-modern');

/**
 * @typedef {{cwd?: string, root?: string, follow?: boolean, nodir?: boolean,
 * dot?: boolean, mark?: boolean, nocase?: boolean, ignore?: string | string[],
 * sync?: boolean, nosort?: boolean}} LegacyOptions
 */

// TL;DR: Adapt only the legacy glob API used by Karma 6 and ASAR 3.
// Details: Those callers need callbacks or Glob.found/statCache, removed by
// modern glob. Keep their matching/order contracts over supported glob 13;
// reject unknown options so consumer upgrades cannot silently change behavior.
// See README.md for the inspected callers, tests, and removal criterion.
const supported = new Set(['cwd', 'root', 'follow', 'nodir', 'dot', 'mark', 'nocase', 'ignore', 'sync', 'nosort']);

/** @param {LegacyOptions} [options] */
function normalize(options = {}) {
  if (!options || typeof options !== 'object' || Array.isArray(options))
    throw new TypeError('Legacy glob options must be an object');
  for (const key of Object.keys(options)) {
    if (!supported.has(key)) throw new Error(`Unsupported legacy glob option: ${key}`);
  }
  const { sync, nosort, mark, ...rest } = options;
  // glob 7 treats Windows separators as separators rather than pattern escapes.
  // glob 7 defaults to case-sensitive matching even on Darwin and Windows.
  return { ...rest, nocase: !!options.nocase, windowsPathsNoEscape: process.platform === 'win32' };
}

/** @param {string[]} files @param {LegacyOptions} [options] */
function finish(files, options = {}) {
  // glob 7 returns forward slashes; glob 13 defaults to native Windows output.
  if (process.platform === 'win32') files = files.map(filename => filename.replaceAll('\\', '/'));
  if (!options.nosort) files.sort((a, b) => a.localeCompare(b, 'en'));
  // glob 7 marks/excludes symlinks to directories too; modern glob does not.
  if (options.mark || options.nodir) {
    return files.flatMap(filename => {
      const directory = fs.statSync(path.resolve(options.cwd || '.', filename), { throwIfNoEntry: false })?.isDirectory();
      if (options.nodir && directory) return [];
      return [options.mark && directory ? filename.replace(/\/$/, '') + '/' : filename];
    });
  }
  return files;
}

/** @param {string} pattern @param {LegacyOptions} [options] */
function sync(pattern, options) {
  return finish(modern.globSync(pattern, normalize(options)), options);
}

/**
 * @param {string} pattern
 * @param {LegacyOptions | ((error: Error | null, files?: string[]) => void)} options
 * @param {(error: Error | null, files?: string[]) => void} [callback]
 */
function glob(pattern, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  if (typeof callback !== 'function') throw new Error('Legacy glob callback is required');
  const globOptions = options;
  const emitter = new EventEmitter();
  Promise.resolve()
    .then(() => modern.glob(pattern, normalize(globOptions)))
    .then(files => finish(files, globOptions))
    .then(
    found => {
      callback(null, found);
      emitter.emit('end', found);
    },
    error => {
      callback(error);
      if (emitter.listenerCount('error')) emitter.emit('error', error);
    }
    );
  return emitter;
}

class Glob {
  /** @param {string} pattern @param {LegacyOptions} options */
  constructor(pattern, options) {
    if (!options?.sync) throw new Error('Only synchronous legacy Glob construction is supported');
    this.found = sync(pattern, options);
    this.statCache = Object.create(null);
    for (const filename of this.found)
      this.statCache[filename] = fs.statSync(path.resolve(options.cwd || '.', filename));
  }
}

module.exports = glob;
glob.glob = glob;
glob.sync = sync;
glob.Glob = Glob;
