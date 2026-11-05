const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const { createRequire } = require('node:module');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const builderRequire = createRequire(require.resolve('app-builder-lib/package.json'));
const asar = builderRequire('@electron/asar');
const checker = builderRequire('./out/asar/asarFileChecker');
const universalRequire = createRequire(builderRequire.resolve('@electron/universal/package.json'));
const universalAsar = universalRequire('./dist/cjs/asar-utils.js');

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'plm-asar4-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const source = path.join(root, 'source with spaces');
  fs.mkdirSync(source);
  fs.writeFileSync(path.join(source, 'package.json'), JSON.stringify({ name: 'fixture', version: '1.0.0', main: 'index.js' }));
  fs.writeFileSync(path.join(source, 'index.js'), 'module.exports = 42');
  return { root, source };
}

test('maintained ASAR preserves archive data, hidden/literal filenames and unpacked files', async t => {
  const { root, source } = fixture(t);
  const archive = path.join(root, 'app.asar');
  fs.writeFileSync(path.join(source, '.hidden'), 'hidden');
  fs.writeFileSync(path.join(source, 'file [one].txt'), 'literal');
  fs.writeFileSync(path.join(source, 'fixture.node'), 'unpacked bytes');
  if (process.platform !== 'win32') fs.symlinkSync('index.js', path.join(source, 'link'));
  await asar.createPackageWithOptions(source, archive, { unpack: '*.node' });
  assert(asar.listPackage(archive).includes('/.hidden'));
  assert.equal(asar.extractFile(archive, 'file [one].txt').toString(), 'literal');
  assert.equal(asar.statFile(archive, 'fixture.node', false).unpacked, true);
  const extracted = path.join(root, 'extracted');
  asar.extractAll(archive, extracted);
  assert.equal(fs.readFileSync(path.join(extracted, 'fixture.node'), 'utf8'), 'unpacked bytes');
  if (process.platform !== 'win32') {
    assert.equal(fs.readlinkSync(path.join(extracted, 'link')), 'index.js');
    assert.equal(fs.readFileSync(path.join(extracted, 'link'), 'utf8'), 'module.exports = 42');
  }
});

test('actual builder entrypoint checks accept valid archives and reject missing entries', async t => {
  const { root, source } = fixture(t);
  const archive = path.join(root, 'app.asar');
  await asar.createPackage(source, archive);
  await checker.checkFileInArchive(archive, 'index.js', 'Fixture');
  await assert.rejects(checker.checkFileInArchive(archive, 'missing.js', 'Fixture'), /"missing\.js" was not found in this archive/);
});

test('actual universal builder integrity and archive merge work with ASAR4', async t => {
  const { root, source } = fixture(t);
  const x64 = path.join(root, 'x64.asar');
  const arm64 = path.join(root, 'arm64.asar');
  const merged = path.join(root, 'merged.asar');
  await asar.createPackage(source, x64);
  await asar.createPackage(source, arm64);
  assert.deepEqual(universalAsar.generateAsarIntegrity(x64), {
    algorithm: 'SHA256',
    hash: createHash('sha256').update(asar.getRawHeader(x64).headerString).digest('hex'),
  });
  await universalAsar.mergeASARs({ x64AsarPath: x64, arm64AsarPath: arm64, outputAsarPath: merged });
  assert.equal(asar.extractFile(merged, 'index.js').toString(), 'module.exports = 42');
  assert.equal(JSON.parse(asar.extractFile(merged, 'package.json').toString()).main, 'index.js');
});
