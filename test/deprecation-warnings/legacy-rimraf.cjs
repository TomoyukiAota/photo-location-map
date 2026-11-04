const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createRequire } = require('node:module');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { promisify } = require('node:util');

const karmaRequire = createRequire(require.resolve('karma/package.json'));
const installerRequire = createRequire(require.resolve('electron-winstaller/package.json'));
const rimraf = karmaRequire('rimraf');
const karmaTemp = karmaRequire('./lib/temp_dir.js');
const temp = installerRequire('temp').track();

function directory(t) {
  const value = fs.mkdtempSync(path.join(os.tmpdir(), 'plm-rimraf-compat-'));
  t.after(() => fs.rmSync(value, { recursive: true, force: true }));
  return value;
}

test('Karma removes populated temporary directories and accepts missing paths', async t => {
  const base = directory(t);
  const target = path.join(base, 'karma');
  fs.mkdirSync(path.join(target, 'child'), { recursive: true });
  fs.writeFileSync(path.join(target, 'child/file.js'), 'content');
  await promisify(karmaTemp.remove)(target);
  assert.equal(fs.existsSync(target), false);
  await promisify(karmaTemp.remove)(target);
});

test('Temp callback cleanup removes tracked files and populated directories', async t => {
  const base = directory(t);
  const target = temp.mkdirSync({ dir: base, prefix: 'temp-' });
  const { path: file, fd } = temp.openSync({ dir: base, prefix: 'file-' });
  fs.closeSync(fd);
  fs.mkdirSync(path.join(target, 'nested'));
  fs.writeFileSync(path.join(target, 'nested/readonly'), 'content');
  fs.chmodSync(path.join(target, 'nested/readonly'), 0o400);
  const counts = await promisify(temp.cleanup)();
  assert.deepEqual(counts, { files: 1, dirs: 1 });
  assert.equal(fs.existsSync(target), false);
  assert.equal(fs.existsSync(file), false);
});

test('Temp synchronous cleanup preserves outside symlink targets', t => {
  const base = directory(t);
  const outside = path.join(base, 'outside');
  fs.mkdirSync(outside);
  fs.writeFileSync(path.join(outside, 'keep'), 'keep');
  const target = temp.mkdirSync({ dir: base, prefix: 'temp-' });
  fs.symlinkSync(outside, path.join(target, 'link'), process.platform === 'win32' ? 'junction' : 'dir');
  assert.deepEqual(temp.cleanupSync(), { files: 0, dirs: 1 });
  assert.equal(fs.existsSync(target), false);
  assert.equal(fs.readFileSync(path.join(outside, 'keep'), 'utf8'), 'keep');
});

test('existing paths containing glob characters are removed literally', async t => {
  const base = directory(t);
  const literal = path.join(base, '[ab]');
  const other = path.join(base, 'a');
  fs.mkdirSync(literal);
  fs.mkdirSync(other);
  await promisify(rimraf)(literal);
  assert.equal(fs.existsSync(literal), false);
  assert.equal(fs.existsSync(other), true);
  fs.mkdirSync(literal);
  rimraf.sync(literal);
  assert.equal(fs.existsSync(literal), false);
  assert.equal(fs.existsSync(other), true);
});

test('missing patterns expand while disabled glob stays literal', async t => {
  const base = directory(t);
  const pattern = `${base.replaceAll('\\', '/')}/*.tmp`;
  const target = path.join(base, 'one.tmp');
  fs.writeFileSync(target, 'content');
  await promisify(rimraf)(pattern, { glob: false });
  assert.equal(fs.existsSync(target), true);
  await promisify(rimraf)(pattern, { maxBusyTries: 6 });
  assert.equal(fs.existsSync(target), false);
  fs.writeFileSync(target, 'content');
  rimraf.sync(pattern);
  assert.equal(fs.existsSync(target), false);
});

test('callbacks run once and unsupported option drift fails visibly', async t => {
  const base = directory(t);
  let count = 0;
  const success = await new Promise(resolve => rimraf(path.join(base, 'absent'), error => {
    count++;
    resolve(error);
  }));
  assert.equal(success, null);
  assert.equal(count, 1);
  const failure = await new Promise(resolve => rimraf(`${base}${path.sep}\0`, error => {
    count++;
    resolve(error);
  }));
  assert.equal(failure.code, 'ERR_INVALID_ARG_VALUE');
  assert.equal(count, 2);
  assert.throws(() => rimraf.sync(path.join(base, 'absent'), { customFsHook() {} }), /Unsupported legacy rimraf option/);
});

test('native path separators work in callback and synchronous patterns', async t => {
  const base = directory(t);
  const target = path.join(base, 'native.tmp');
  const pattern = path.join(base, '*.tmp');
  fs.writeFileSync(target, 'content');
  await promisify(rimraf)(pattern);
  assert.equal(fs.existsSync(target), false);
  fs.writeFileSync(target, 'content');
  rimraf.sync(pattern);
  assert.equal(fs.existsSync(target), false);
});
