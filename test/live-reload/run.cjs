const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { EventEmitter } = require('node:events');
const { spawn } = require('node:child_process');

function checkRelaunchBurst(helper) {
  const watcher = new EventEmitter();
  let closed = false, quits = 0, reloads = 0;
  const relaunches = [];
  watcher.close = async () => { closed = true; };
  const app = new EventEmitter();
  app.relaunch = options => relaunches.push(options);
  // Model a quit still in progress while a compiler emits more file changes.
  app.quit = () => { quits++; };
  const argv = ['electron', 'main.cjs', '--live-reload', '--probe-token', 'kept-value'];
  const exported = {};
  vm.runInNewContext(fs.readFileSync(helper, 'utf8'), {
    exports: exported,
    process: { argv },
    require: name => {
      if (name === 'electron') return { app, BrowserWindow: { getAllWindows: () => [
        { webContents: { reloadIgnoringCache: () => { reloads++; } } },
      ] } };
      if (name === 'path') return path;
      if (name === 'chokidar6') return { watch: () => watcher };
      if (name === '../src-shared/log/logger') return { Logger: { error: error => { throw error; } } };
      throw new Error('Unexpected watcher dependency: ' + name);
    },
  });
  const mainFile = path.resolve('watcher-burst/main.cjs');
  exported.configureLiveReload(mainFile);
  for (const name of ['asset.txt', 'module.js', 'worker.cjs', 'module.mjs'])
    watcher.emit('change', path.join(path.dirname(mainFile), name));
  assert.equal(reloads, 1, 'Non-code changes must still reload the renderer.');
  assert.equal(relaunches.length, 1, 'A compilation burst must request exactly one relaunch.');
  assert.equal(quits, 1);
  assert.deepEqual(relaunches[0].args, argv.slice(1));
  app.emit('will-quit');
  assert.equal(closed, true);
  return { queuedRelaunches: relaunches.length, quitRequests: quits, watcherClosed: closed };
}

async function main() {
  const helper = path.resolve(__dirname, '../../src-main/configure-live-reload.js');
  assert.ok(fs.existsSync(helper), 'Build src-main before running the watcher lifecycle check.');
  const compilationBurst = checkRelaunchBurst(helper);
  const results = [];
  for (const mode of ['quit', 'soft', 'relaunch', 'module-relaunch']) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'plm-watch-check-'));
    const source = path.join(root, 'source');
    fs.mkdirSync(source);
    for (const name of ['appData', 'userData', 'sessionData']) fs.mkdirSync(path.join(root, name));
    const entry = path.join(source, 'main.cjs');
    fs.writeFileSync(path.join(source, 'other.txt'), 'before');
    fs.writeFileSync(path.join(source, 'module.js'), 'module.exports = "before";\n');
    fs.writeFileSync(entry, `
const { app, BrowserWindow } = require('electron');
app.disableHardwareAcceleration();
const fs = require('node:fs'), path = require('node:path');
const root = path.dirname(__dirname), mode = ${JSON.stringify(mode)};
for (const name of ['appData','userData','sessionData']) app.setPath(name, path.join(root, name));
const second = fs.existsSync(path.join(root, 'started'));
fs.writeFileSync(path.join(root, 'started'), 'yes');
if (second) fs.writeFileSync(path.join(root, 'second.pid'), String(process.pid));
fs.writeFileSync(path.join(root, second ? 'module-second-value' : 'module-first-value'), require('./module.js'));
const watcher = require(${JSON.stringify(helper)}).configureLiveReload(__filename);
const ready = new Promise(resolve => watcher.once('ready', resolve));
app.on('quit', () => fs.writeFileSync(path.join(root, second ? 'second-quit' : 'first-quit'), 'yes'));
app.whenReady().then(async () => {
  const window = new BrowserWindow({ show: false });
  let loads = 0;
  window.webContents.on('did-finish-load', () => {
    loads++;
    if (mode === 'soft' && loads === 2) {
      fs.writeFileSync(path.join(root, 'soft-reloaded'), 'yes');
      app.quit();
    }
  });
  await window.loadURL('data:text/html,watcher-check');
  await ready;
  if (mode === 'soft') fs.writeFileSync(path.join(__dirname, 'other.txt'), 'after');
  else if (mode === 'relaunch' && !second) fs.appendFileSync(__filename, '\\n// trigger restart\\n');
  else if (mode === 'module-relaunch' && !second) fs.writeFileSync(path.join(__dirname, 'module.js'), 'module.exports = "after";\\n');
  else {
    if (second) fs.writeFileSync(path.join(root, 'arguments.json'), JSON.stringify({
      liveReload: process.argv.includes('--live-reload'), token: process.argv.includes('kept-value')
    }));
    app.quit();
  }
}).catch(error => { console.error(error); app.exit(1); });
`);
    const environment = { ...process.env, PLM_EM_MAIN: 'true' };
    for (const name of ['ELECTRON_RUN_AS_NODE', 'NODE_OPTIONS', 'PLM_E2E', 'PLM_TEST_ROOT']) delete environment[name];
    const child = spawn(require('electron'), [
      ...(process.platform === 'linux' ? ['--no-sandbox'] : []),
      '--user-data-dir=' + path.join(root, 'userData'), entry, '--live-reload', '--probe-token', 'kept-value',
    ], { env: environment, stdio: ['ignore', 'inherit', 'inherit'] });
    let timedOut = false, secondPid;
    const timer = setTimeout(() => { timedOut = true; child.kill('SIGKILL'); }, 15000);
    try {
      const exit = await new Promise((resolve, reject) => {
        child.once('error', reject);
        child.once('exit', (code, signal) => resolve({ code, signal }));
      });
      clearTimeout(timer);
      assert.equal(timedOut, false, mode + ' must stop without forced termination.');
      assert.equal(exit.code, 0);
      assert.ok(fs.existsSync(path.join(root, 'first-quit')));
      if (mode === 'soft') assert.ok(fs.existsSync(path.join(root, 'soft-reloaded')));
      if (mode === 'relaunch' || mode === 'module-relaunch') {
        for (let attempt = 0; attempt < 100 && !fs.existsSync(path.join(root, 'second-quit')); attempt++) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        assert.ok(fs.existsSync(path.join(root, 'second-quit')), 'The relaunched process must quit too.');
        secondPid = Number(fs.readFileSync(path.join(root, 'second.pid'), 'utf8'));
        assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, 'arguments.json'))), { liveReload: true, token: true });
        if (mode === 'module-relaunch') {
          assert.equal(fs.readFileSync(path.join(root, 'module-first-value'), 'utf8'), 'before');
          assert.equal(fs.readFileSync(path.join(root, 'module-second-value'), 'utf8'), 'after',
            'The relaunched main process must observe the changed module instead of its cached value.');
        }
        let alive = true;
        for (let attempt = 0; attempt < 50 && alive; attempt++) {
          try {
            process.kill(secondPid, 0);
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error) {
            if (error.code !== 'ESRCH') throw error;
            alive = false;
          }
        }
        assert.equal(alive, false, 'The relaunched process must exit without forced termination.');
      }
      results.push({ mode, exit: exit.code, forcedTermination: false, quitHooksRan: true,
        ...(mode === 'module-relaunch' ? { moduleValueAfterRelaunch: 'after' } : {}) });
    } finally {
      clearTimeout(timer);
      if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
      if (!secondPid && fs.existsSync(path.join(root, 'second.pid'))) secondPid = Number(fs.readFileSync(path.join(root, 'second.pid'), 'utf8'));
      if (secondPid) try { process.kill(secondPid, 'SIGKILL'); } catch (error) { if (error.code !== 'ESRCH') throw error; }
      fs.rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    }
  }
  const metadata = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../node_modules/chokidar6/package.json')));
  process.stdout.write(JSON.stringify({ watcher: metadata.version, compilationBurst, results }, null, 2) + '\n');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
