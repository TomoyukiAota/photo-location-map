const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

async function main() {
  const helper = path.resolve(__dirname, '../../src-main/configure-live-reload.js');
  assert.ok(fs.existsSync(helper), 'Build src-main before running the watcher lifecycle check.');
  const results = [];
  for (const mode of ['quit', 'soft', 'relaunch']) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'plm-watch-check-'));
    const source = path.join(root, 'source');
    fs.mkdirSync(source);
    for (const name of ['appData', 'userData', 'sessionData']) fs.mkdirSync(path.join(root, name));
    const entry = path.join(source, 'main.cjs');
    fs.writeFileSync(path.join(source, 'other.txt'), 'before');
    fs.writeFileSync(entry, `
const { app, BrowserWindow } = require('electron');
app.disableHardwareAcceleration();
const fs = require('node:fs'), path = require('node:path');
const root = path.dirname(__dirname), mode = ${JSON.stringify(mode)};
for (const name of ['appData','userData','sessionData']) app.setPath(name, path.join(root, name));
const second = fs.existsSync(path.join(root, 'started'));
fs.writeFileSync(path.join(root, 'started'), 'yes');
if (second) fs.writeFileSync(path.join(root, 'second.pid'), String(process.pid));
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
      if (mode === 'relaunch') {
        for (let attempt = 0; attempt < 100 && !fs.existsSync(path.join(root, 'second-quit')); attempt++) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        assert.ok(fs.existsSync(path.join(root, 'second-quit')), 'The relaunched process must quit too.');
        secondPid = Number(fs.readFileSync(path.join(root, 'second.pid'), 'utf8'));
        assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, 'arguments.json'))), { liveReload: true, token: true });
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
      results.push({ mode, exit: exit.code, forcedTermination: false, quitHooksRan: true });
    } finally {
      clearTimeout(timer);
      if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
      if (!secondPid && fs.existsSync(path.join(root, 'second.pid'))) secondPid = Number(fs.readFileSync(path.join(root, 'second.pid'), 'utf8'));
      if (secondPid) try { process.kill(secondPid, 'SIGKILL'); } catch (error) { if (error.code !== 'ESRCH') throw error; }
      fs.rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    }
  }
  const metadata = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../node_modules/chokidar6/package.json')));
  process.stdout.write(JSON.stringify({ watcher: metadata.version, results }, null, 2) + '\n');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
