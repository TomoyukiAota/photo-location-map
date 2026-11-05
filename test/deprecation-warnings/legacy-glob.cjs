const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { EventEmitter } = require('node:events');
const { createRequire } = require('node:module');
const { promisify } = require('node:util');

const karmaRequire = createRequire(require.resolve('karma/package.json'));
const adapter = karmaRequire('glob');
const builderRequire = createRequire(require.resolve('app-builder-lib/package.json'));
const asar = builderRequire('@electron/asar');

function fixture(t, withLink = true) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'plm-glob-compat-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  fs.mkdirSync(path.join(directory, 'tree/nested'), { recursive: true });
  for (const name of ['a.js', 'Z.js', 'x.ts', '.hidden', 'file [one].js', 'file (two).js', 'file {three}.js', 'nested/b.js', 'nested/.secret'])
    fs.writeFileSync(path.join(directory, 'tree', name), name);
  if (withLink) {
    const target = process.platform === 'win32' ? path.join(directory, 'tree/nested') : 'nested';
    fs.symlinkSync(target, path.join(directory, 'tree/link-dir'), process.platform === 'win32' ? 'junction' : 'dir');
  }
  return path.join(directory, 'tree').replaceAll('\\', '/');
}

test('legacy glob callbacks and sync preserve patterns, order, exclusions and directory marks', async t => {
  const directory = fixture(t);
  const visible = ['a.js', 'file (two).js', 'file [one].js', 'file {three}.js', 'link-dir', 'link-dir/b.js', 'nested', 'nested/b.js', 'x.ts', 'Z.js'];
  const files = visible.filter(name => !['link-dir', 'nested'].includes(name));
  const cases = [
    ['**/*', {}, visible],
    ['**/*', { dot: true }, ['.hidden', ...visible, 'link-dir/.secret', 'nested/.secret']],
    ['**/*.js', { cwd: '/', follow: true, nodir: true, sync: true }, files.filter(name => name.endsWith('.js'))],
    ['*', { mark: true, nocase: true }, ['a.js', 'file (two).js', 'file [one].js', 'file {three}.js', 'link-dir/', 'nested/', 'x.ts', 'Z.js']],
    ['**/*', { nodir: true }, files],
    ['**/*', { nodir: true, mark: true }, files],
    ['{a,Z}.js', {}, ['a.js', 'Z.js']],
    ['no-match-*', {}, []]
  ];
  for (const [pattern, options, expected] of cases) {
    const expectedPaths = expected.map(name => `${directory}/${name}`).sort((a, b) => a.localeCompare(b, 'en'));
    assert.deepEqual(adapter.sync(`${directory}/${pattern}`, options), expectedPaths);
    assert.deepEqual(await promisify(adapter)(`${directory}/${pattern}`, options), expectedPaths);
  }
  const ignored = adapter.sync(`${directory}/**/*`, { dot: true, ignore: `${directory}/nested/**` });
  assert(!ignored.some(filename => filename.startsWith(`${directory}/nested`)));
});

test('actual Karma file-list refresh, excludes, deduplication, mtime and watch updates work', async t => {
  const directory = fixture(t);
  const FileList = require('karma/lib/file-list');
  const { createPatternObject } = require('karma/lib/config');
  const processed = [];
  const list = new FileList([
    createPatternObject(`${directory}/**/*.js`),
    createPatternObject(`${directory}/a.js`),
    createPatternObject('https://example.invalid/test.js')
  ], [`${directory}/Z.js`], new EventEmitter(), async file => processed.push(file), 0);
  const files = await list.refresh();
  assert(files.included.some(file => file.path === `${directory}/a.js`));
  assert(!files.included.some(file => file.path === `${directory}/Z.js`));
  assert.equal(files.included.filter(file => file.path === `${directory}/a.js`).length, 1);
  const file = files.included.find(file => file.path === `${directory}/nested/b.js`);
  assert.equal(file.mtime.getTime(), fs.statSync(file.path).mtime.getTime());
  assert(processed.length > 0);
  fs.writeFileSync(`${directory}/new.js`, 'new');
  await list.addFile(`${directory}/new.js`);
  assert(list.files.included.some(file => file.path === `${directory}/new.js`));
  await list.removeFile(`${directory}/new.js`);
  assert(!list.files.included.some(file => file.path === `${directory}/new.js`));
});

test('legacy Glob retains dangling-link stats for Karma instead of throwing', async t => {
  const directory = fixture(t, false);
  const target = path.join(directory, 'link-target');
  const link = `${directory}/broken.js`;
  fs.mkdirSync(target);
  fs.symlinkSync(target, link, process.platform === 'win32' ? 'junction' : 'dir');
  fs.rmdirSync(target);
  const glob = new adapter.Glob(`${directory}/*.js`, { cwd: '/', follow: true, nodir: true, sync: true });
  assert(glob.found.includes(link));
  assert(glob.statCache[link].isSymbolicLink());
  const FileList = require('karma/lib/file-list');
  const { createPatternObject } = require('karma/lib/config');
  const list = new FileList([createPatternObject(link)], [], new EventEmitter(), async () => {}, 0);
  const files = await list.refresh();
  assert.equal(files.included[0].mtime.getTime(), fs.lstatSync(link).mtime.getTime());
});

test('legacy Glob skips files removed after matching but preserves other stat failures', t => {
  const directory = fixture(t, false);
  const filename = `${directory}/a.js`;
  const modern = createRequire(karmaRequire.resolve('glob'))('glob-modern');
  const originalGlob = modern.globSync;
  modern.globSync = (...args) => {
    const found = originalGlob(...args);
    fs.unlinkSync(filename);
    return found;
  };
  try {
    const glob = new adapter.Glob(filename, { follow: true, nodir: true, sync: true });
    assert.deepEqual(glob.found, []);
    assert.equal(Object.keys(glob.statCache).length, 0);
  } finally {
    modern.globSync = originalGlob;
  }
  fs.writeFileSync(filename, 'file');
  const failure = Object.assign(new Error('Injected stat I/O failure'), { code: 'EIO' });
  const originalStat = fs.statSync;
  fs.statSync = (target, ...args) => {
    if (path.resolve(target) === path.resolve(filename)) throw failure;
    return originalStat(target, ...args);
  };
  try {
    assert.throws(() => new adapter.Glob(filename, { sync: true }), error => error === failure);
  } finally {
    fs.statSync = originalStat;
  }
});

test('POSIX escaped metacharacters select literal filenames', { skip: process.platform === 'win32' }, async t => {
  const directory = fixture(t);
  const pattern = `${directory}/file \\[one\\].js`;
  const expected = [`${directory}/file [one].js`];
  assert.deepEqual(adapter.sync(pattern), expected);
  assert.deepEqual(await promisify(adapter)(pattern), expected);
});

test('matching stays case-sensitive by default on every platform', async t => {
  const directory = fixture(t);
  const uppercase = `${directory}/case.JS`;
  fs.writeFileSync(uppercase, 'uppercase extension');
  assert.deepEqual(adapter.sync(`${directory}/*.JS`), [uppercase]);
  assert.deepEqual(await promisify(adapter)(`${directory}/*.JS`), [uppercase]);
  assert(!adapter.sync(`${directory}/*.js`).includes(uppercase));
  const insensitive = adapter.sync(`${directory}/*.JS`, { nocase: true });
  assert(insensitive.includes(uppercase));
  assert(insensitive.includes(`${directory}/a.js`));
});

test('actual ASAR3 callback glob preserves archive order, hidden files, symlinks and unpacked data', async t => {
  // ASAR 3 misinterprets absolute Windows junction targets; its implementation
  // is unchanged. Windows junction discovery is covered by the glob/Karma cases.
  const withLink = process.platform !== 'win32';
  const directory = fixture(t, withLink);
  const archive = path.join(path.dirname(directory), 'fixture.asar');
  await asar.createPackageWithOptions(directory, archive, { unpack: '**/*.ts' });
  const names = asar.listPackage(archive).map(filename => filename.replaceAll('\\', '/'));
  assert(names.includes('/.hidden'));
  if (withLink) assert.equal(asar.statFile(archive, 'link-dir', false).link, 'nested');
  assert.equal(asar.extractFile(archive, '.hidden').toString(), '.hidden');
  assert.equal(asar.statFile(archive, 'x.ts').unpacked, true);
  const topLevelNames = Object.keys(JSON.parse(asar.getRawHeader(archive).headerString).files);
  const expectedNames = ['.hidden', 'a.js', 'file (two).js', 'file [one].js', 'file {three}.js', 'link-dir', 'nested', 'x.ts', 'Z.js'];
  assert.deepEqual(topLevelNames, expectedNames.filter(name => withLink || name !== 'link-dir'));
  const extracted = path.join(path.dirname(directory), 'extracted');
  asar.extractAll(archive, extracted);
  if (withLink) assert.equal(fs.readFileSync(path.join(extracted, 'link-dir/b.js'), 'utf8'), 'nested/b.js');
  assert.equal(fs.readFileSync(path.join(extracted, 'nested/b.js'), 'utf8'), 'nested/b.js');
  assert.equal(fs.readFileSync(path.join(extracted, 'x.ts'), 'utf8'), 'x.ts');
});

test('unsupported legacy glob option/API drift and callback errors fail visibly', async () => {
  assert.throws(() => adapter.sync('*', { statCache: {} }), /Unsupported legacy glob option/);
  assert.throws(() => new adapter.Glob('*', {}), /Only synchronous/);
  let callbacks = 0;
  const callbackError = await new Promise(resolve => adapter('*', { unexpected: true }, error => {
    callbacks++;
    resolve(error);
  }));
  assert.match(callbackError.message, /Unsupported legacy glob option/);
  assert.equal(callbacks, 1);
});

test('a stat failure during asynchronous directory marking reaches the callback once', async t => {
  const directory = fixture(t);
  const filename = `${directory}/a.js`;
  const failure = Object.assign(new Error('Injected stat I/O failure'), { code: 'EIO' });
  const originalStat = fs.statSync;
  fs.statSync = function (target, ...args) {
    if (path.resolve(target) === path.resolve(filename)) throw failure;
    return originalStat(target, ...args);
  };
  let callbacks = 0;
  try {
    const callbackError = await new Promise(resolve => adapter(filename, { mark: true }, error => {
      callbacks++;
      resolve(error);
    }));
    assert.equal(callbackError, failure);
    assert.equal(callbacks, 1);
  } finally {
    fs.statSync = originalStat;
  }
});
