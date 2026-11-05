const assert = require('node:assert/strict');
const { execFile } = require('node:child_process');
const fs = require('node:fs');
const { createRequire } = require('node:module');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { promisify } = require('node:util');
const { patchTemp } = require('../../script/patch-temp');

const installerRequire = createRequire(require.resolve('electron-winstaller/package.json'));
const tempRoot = path.dirname(installerRequire.resolve('temp/package.json'));
const tempRequire = createRequire(path.join(tempRoot, 'package.json'));
const temp = installerRequire('temp').track();

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'plm-temp-migration-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

function unpatchedFixture(t) {
  const root = fixture(t);
  fs.mkdirSync(path.join(root, 'lib'));
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ version: '0.9.4' }));
  const source = fs.readFileSync(path.join(tempRoot, 'lib/temp.js'), 'utf8')
    .replaceAll('maxRetries: 6', 'maxBusyTries: 6')
    .replaceAll('rimraf.rimraf(toDelete, { maxBusyTries: 6 }).then(() => rimrafCallback(), rimrafCallback);',
      'rimraf(toDelete, { maxBusyTries: 6 }, rimrafCallback);');
  fs.writeFileSync(path.join(root, 'lib/temp.js'), source);
  return root;
}

test('Temp call-site migration is repeatable and installed source matches the reviewed result', t => {
  const root = unpatchedFixture(t);
  patchTemp(root);
  const first = fs.readFileSync(path.join(root, 'lib/temp.js'), 'utf8');
  patchTemp(root);
  assert.equal(fs.readFileSync(path.join(root, 'lib/temp.js'), 'utf8'), first);
  assert.equal(fs.readFileSync(path.join(tempRoot, 'lib/temp.js'), 'utf8'), first,
    'Run npm ci to apply the guarded Temp call-site migration.');
});

test('Temp version/source drift fails without changing the unexpected source', t => {
  const root = unpatchedFixture(t);
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ version: '0.9.5' }));
  assert.throws(() => patchTemp(root), /Review.*version 0.9.5/);
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ version: '0.9.4' }));
  const filename = path.join(root, 'lib/temp.js');
  fs.appendFileSync(filename, '\n// source drift\n');
  const before = fs.readFileSync(filename, 'utf8');
  assert.throws(() => patchTemp(root), /Unexpected Temp source/);
  assert.equal(fs.readFileSync(filename, 'utf8'), before);
});

test('real Temp async cleanup removes tracked files and populated literal-path directories', async t => {
  const root = fixture(t);
  const base = path.join(root, '[literal]');
  fs.mkdirSync(base);
  const directory = await promisify(temp.mkdir)({ dir: base, prefix: 'directory-' });
  const file = temp.openSync({ dir: base, prefix: 'file-' });
  fs.closeSync(file.fd);
  fs.mkdirSync(path.join(directory, 'nested'));
  fs.writeFileSync(path.join(directory, 'nested/data'), 'data');
  fs.chmodSync(path.join(directory, 'nested/data'), 0o400);
  assert.deepEqual(await promisify(temp.cleanup)(), { files: 1, dirs: 1 });
  assert.equal(fs.existsSync(directory), false);
  assert.equal(fs.existsSync(file.path), false);
  assert.equal(fs.existsSync(base), true);
});

test('real Temp sync cleanup preserves outside symlink/junction targets and accepts missing files', t => {
  const root = fixture(t);
  const outside = path.join(root, 'outside');
  fs.mkdirSync(outside);
  fs.writeFileSync(path.join(outside, 'keep'), 'keep');
  const directory = temp.mkdirSync({ dir: root, prefix: 'directory-' });
  const file = temp.openSync({ dir: root, prefix: 'file-' });
  fs.closeSync(file.fd);
  fs.unlinkSync(file.path);
  fs.symlinkSync(outside, path.join(directory, 'link'), process.platform === 'win32' ? 'junction' : 'dir');
  assert.deepEqual(temp.cleanupSync(), { files: 1, dirs: 1 });
  assert.equal(fs.existsSync(directory), false);
  assert.equal(fs.readFileSync(path.join(outside, 'keep'), 'utf8'), 'keep');
});

test('real Temp async cleanup retains six retries and reports removal failures exactly once', async t => {
  const root = fixture(t);
  temp.mkdirSync({ dir: root, prefix: 'directory-' });
  const rimraf = tempRequire('rimraf');
  const original = rimraf.rimraf;
  const failure = Object.assign(new Error('Injected removal failure'), { code: 'EIO' });
  let callbacks = 0;
  rimraf.rimraf = (_filename, options) => {
    assert.equal(options.maxRetries, 6);
    return Promise.reject(failure);
  };
  try {
    const error = await new Promise(resolve => temp.cleanup(error => { callbacks++; resolve(error); }));
    assert(error);
    assert.match(String(error), /Injected removal failure/);
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(callbacks, 1);
  } finally {
    rimraf.rimraf = original;
  }
});

test('actual Windows-installer temp helper creates directories and removes contents at process exit', async t => {
  const helper = installerRequire.resolve('./lib/temp-utils');
  const script = `
    const fs = require('node:fs');
    const path = require('node:path');
    require(process.argv[1]).createTempDir('plm-installer-').then(directory => {
      fs.writeFileSync(path.join(directory, 'artifact'), 'temporary artifact');
      process.stdout.write(JSON.stringify({ directory }));
    }).catch(error => { console.error(error); process.exitCode = 1; });
  `;
  const { stdout } = await promisify(execFile)(process.execPath, ['-e', script, helper], { timeout: 15000 });
  const { directory } = JSON.parse(stdout);
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  assert.equal(fs.existsSync(directory), false);
});
