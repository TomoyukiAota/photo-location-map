'use strict';

const { createHash } = require('node:crypto');
const fs = require('node:fs');
const { createRequire } = require('node:module');
const path = require('node:path');

// TL;DR: Migrate Temp 0.9.4's four removal calls to the maintained rimraf API.
// Details: stable electron-builder still installs Temp through its Squirrel
// peer even for NSIS projects. A plain rimraf6 override breaks Temp's callback
// cleanup. Use rimraf.rimraf's Promise API at its two async call sites, and
// retain its two .sync calls. Rename maxBusyTries to maxRetries at all four
// sites so the explicit retry count survives. No general legacy adapter or
// global patch is required. Exact version and full-source hashes reject drift;
// repeated installs accept only the reviewed result. Remove this workaround
// when stable upstream tooling removes Temp or updates these call sites.
function patchTemp(root = path.dirname(createRequire(require.resolve('electron-winstaller/package.json')).resolve('temp/package.json'))) {
  const version = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;
  if (version !== '0.9.4') throw new Error(`Review the Temp removal migration for version ${version}.`);
  const filename = path.join(root, 'lib/temp.js');
  const source = fs.readFileSync(filename, 'utf8');
  const hash = value => createHash('sha256').update(value).digest('hex');
  const before = 'ab00e9972ccbd639a4558519f40ad6839cb2c616b3da6cb9c12dea2828c6c9c9';
  const after = '58805e905d323ec14924b1cf21d452e746a9a6912ae65d78f0d088d5b1d81666';
  if (hash(source) === after) return;
  if (hash(source) !== before) throw new Error('Unexpected Temp source. Review the removal migration.');
  const replacement = source
    .replaceAll('maxBusyTries: 6', 'maxRetries: 6')
    .replaceAll('rimraf(toDelete, { maxRetries: 6 }, rimrafCallback);',
      'rimraf.rimraf(toDelete, { maxRetries: 6 }).then(() => rimrafCallback(), rimrafCallback);');
  if (hash(replacement) !== after) throw new Error('Invalid Temp removal migration.');
  fs.writeFileSync(filename, replacement);
}

module.exports = { patchTemp };
if (require.main === module) patchTemp();
