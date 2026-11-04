// Guard the API assumptions behind package.json's scoped dependency overrides.
// See docs/tasks/20261105_deprecation-warnings/DEPENDENCIES.md before updating them.
const assert = require('node:assert/strict');
const { execFile } = require('node:child_process');
const fs = require('node:fs');
const { createRequire } = require('node:module');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { promisify } = require('node:util');

const root = path.resolve(__dirname, '../..');

test('updater reuses only a matching, present downloaded artifact', async (t) => {
  const { DownloadedUpdateHelper } = require('electron-updater/out/DownloadedUpdateHelper');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'plm-updater-compat-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const artifact = path.join(directory, 'update.zip');
  fs.writeFileSync(artifact, 'update fixture');
  const info = {
    version: '1.12.2',
    files: [{ url: 'update.zip', sha512: 'checksum', size: 14 }],
    releaseDate: '2026-11-05T00:00:00.000Z',
    releaseNotes: [{ version: '1.12.2', note: 'Fixture update' }]
  };
  const fileInfo = { url: new URL('https://example.invalid/update.zip'), info: info.files[0] };
  const helper = new DownloadedUpdateHelper(directory);
  const logger = { info() {}, warn() {} };
  await helper.setDownloadedFile(artifact, null, info, fileInfo, 'update.zip', false);

  const validate = (updateInfo, updateFileInfo) => helper.validateDownloadedPath(artifact, updateInfo, updateFileInfo, logger);
  assert.equal(await validate(structuredClone(info), { ...fileInfo, info: { ...fileInfo.info } }), artifact);
  assert.equal(await validate({ ...info, version: '1.12.3' }, fileInfo), null);
  assert.equal(await validate({ ...info, releaseNotes: [] }, fileInfo), null);
  assert.equal(await validate(info, { ...fileInfo, info: { ...fileInfo.info, sha512: 'changed' } }), null);
  assert.equal(await validate(info, { ...fileInfo, info: { ...fileInfo.info, size: 15 } }), null);
  fs.unlinkSync(artifact);
  assert.equal(await validate(info, fileInfo), null);
});

test('Electron Mocha discovers main, renderer, and shared test patterns', (t) => {
  const electronMochaRequire = createRequire(require.resolve('electron-mocha/package.json'));
  const mochaRequire = createRequire(electronMochaRequire.resolve('mocha/package.json'));
  const lookupFiles = mochaRequire('./lib/cli/lookup-files');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'plm-mocha-compat-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  fs.mkdirSync(path.join(directory, 'nested'));
  for (const name of ['nested/a.spec.em.main.ts', 'nested/b.spec.em.renderer.ts', 'nested/c.spec.em.both.ts', 'nested/ignored.spec.ts']) {
    fs.writeFileSync(path.join(directory, name), '');
  }
  for (const type of ['main', 'renderer']) {
    const found = lookupFiles(`${directory.replaceAll('\\', '/')}/**/*.spec.em.@(${type}|both).ts`);
    assert.deepEqual(found.map((file) => path.basename(file)).sort(), [type === 'main' ? 'a.spec.em.main.ts' : 'b.spec.em.renderer.ts', 'c.spec.em.both.ts']);
  }
});

test('builder download proxy bootstrap routes and bypasses HTTP requests', async () => {
  const builderRequire = createRequire(require.resolve('app-builder-lib/package.json'));
  const getPath = builderRequire.resolve('@electron/get');
  await promisify(execFile)(process.execPath, [path.join(__dirname, 'proxy-fixture.cjs'), getPath], {
    cwd: root,
    timeout: 15000,
    env: {
      ...process.env,
      GLOBAL_AGENT_HTTP_PROXY: '',
      GLOBAL_AGENT_HTTPS_PROXY: '',
      GLOBAL_AGENT_NO_PROXY: '',
      GLOBAL_AGENT_ENVIRONMENT_VARIABLE_NAMESPACE: 'GLOBAL_AGENT_',
      GLOBAL_AGENT_FORCE_GLOBAL_AGENT: 'true'
    }
  });
});
