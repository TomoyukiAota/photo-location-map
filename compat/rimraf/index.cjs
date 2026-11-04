const assert = require('node:assert');
const fs = require('node:fs');
const glob = require('glob-modern');

// TL;DR: Keep Karma/Temp's callback API while Node owns filesystem removal.
// Details: These consumers use only generated paths and maxBusyTries (Temp: 6).
// Existing paths containing glob syntax must be literal; only missing patterns
// expand. Node handles symlinks and Windows removal/retries. Its EMFILE/backoff
// policy replaces old rimraf's global emfileWait/tight Windows loops; neither
// consumer customizes those. Reject option drift; this is not a full rimraf shim.
// Remove when compatible Karma/Temp releases no longer need legacy removal APIs.
function optionsFor(options) {
  for (const key of Object.keys(options)) {
    if (!['maxBusyTries', 'disableGlob', 'glob'].includes(key)) {
      throw new TypeError(`Unsupported legacy rimraf option: ${key}`);
    }
  }
  return { recursive: true, force: true, maxRetries: options.maxBusyTries || 3, retryDelay: 100 };
}

function globOptions(options) {
  return { nocase: false, ...(typeof options.glob === 'object' ? options.glob : {}), windowsPathsNoEscape: process.platform === 'win32' };
}

function shouldExpand(target, options) {
  return options.disableGlob !== true && options.glob !== false && glob.hasMagic(target, globOptions(options));
}

async function targetsFor(target, options) {
  if (!shouldExpand(target, options)) return [target];
  try {
    await fs.promises.lstat(target);
    return [target];
  } catch (error) {
    if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') throw error;
  }
  return glob.glob(target, globOptions(options));
}

function targetsForSync(target, options) {
  if (!shouldExpand(target, options)) return [target];
  try {
    fs.lstatSync(target);
    return [target];
  } catch (error) {
    if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') throw error;
  }
  return glob.globSync(target, globOptions(options));
}

function rimraf(target, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  assert(target, 'rimraf: missing path');
  assert.equal(typeof target, 'string', 'rimraf: path should be a string');
  assert.equal(typeof callback, 'function', 'rimraf: callback function required');
  assert(options && typeof options === 'object', 'rimraf: options should be object');
  const rmOptions = optionsFor(options);
  targetsFor(target, options).then(targets => Promise.all(targets.map(file => fs.promises.rm(file, rmOptions))))
    .then(() => callback(null), error => callback(error));
}

rimraf.sync = function (target, options = {}) {
  assert(target, 'rimraf: missing path');
  assert.equal(typeof target, 'string', 'rimraf: path should be a string');
  assert(options && typeof options === 'object', 'rimraf: options should be object');
  const rmOptions = optionsFor(options);
  for (const file of targetsForSync(target, options)) fs.rmSync(file, rmOptions);
};

module.exports = rimraf;
