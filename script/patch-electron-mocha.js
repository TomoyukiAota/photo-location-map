'use strict';

const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

// TL;DR: Electron-Mocha 13.1.0 unnecessarily launches Electron through cmd.exe
// on Windows, producing DEP0190 twice per suite. Spawn the executable directly.
// Details: both the CLI and detached profile cleanup pass a real Electron binary
// and a separate argv array, so neither requires shell expansion. Direct spawn
// also preserves spaces and shell metacharacters in paths/arguments. Keep the
// upstream stdio, signal/exit forwarding and detached cleanup unchanged. Version
// and complete-source hashes make dependency drift fail before either file is
// written; repeated installs accept only the exact patched sources. Remove this
// workaround when upstream fixes both sites. This changes a development tool,
// not the packaged application. ELECTRON_PATH must identify an executable, as
// the installed Electron package does; command scripts are not supported here.
const patches = [
  {
    file: 'bin/electron-mocha',
    before: '68ec7210526a86c79815f58ab4ba0b560434dc285d7bd04dbb540c0782ac4e63',
    after: 'a3220109cd7369da07aa41558945b842990c822c07f0de6d7eabfe493803ab07',
    from: "{ shell: process.platform === 'win32' }",
    to: '{ shell: false }',
  },
  {
    file: 'lib/main.js',
    before: 'f6f304570be10676417a9ba226bc040a7b815814b878505f9883c2c0be2cfd91',
    after: '378fcce8037528f21a3e508cd880f0ecf54aab1baf8125ca0ae9cdf6818c0d9c',
    from: "shell: process.platform === 'win32'",
    to: 'shell: false',
  },
];

function patchElectronMocha(root = path.dirname(require.resolve('electron-mocha/package.json'))) {
  const version = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;
  if (version !== '13.1.0') {
    throw new Error(`Review the Electron-Mocha spawn workaround for version ${version}.`);
  }
  const digest = source => createHash('sha256').update(source).digest('hex');
  const changes = patches.map(patch => {
    const filename = path.join(root, patch.file);
    const source = fs.readFileSync(filename, 'utf8');
    const hash = digest(source);
    if (hash === patch.after) return null;
    if (hash !== patch.before) {
      throw new Error(`Unexpected Electron-Mocha source: ${patch.file}. Review the spawn workaround.`);
    }
    const replacement = source.replace(patch.from, patch.to);
    if (digest(replacement) !== patch.after) throw new Error(`Invalid replacement: ${patch.file}.`);
    return { filename, replacement };
  });
  for (const change of changes) {
    if (change) fs.writeFileSync(change.filename, change.replacement);
  }
}

module.exports = { patchElectronMocha };
if (require.main === module) patchElectronMocha();
