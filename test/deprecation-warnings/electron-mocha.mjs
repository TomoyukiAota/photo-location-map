import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { patchElectronMocha } from '../../script/patch-electron-mocha.js';

// Electron-Mocha's own files, which are CommonJS, are run below with stand-ins for what they require.
const installed = path.dirname(fileURLToPath(import.meta.resolve('electron-mocha/package.json')));
const files = ['bin/electron-mocha', 'lib/main.js'];
const read = (root, file) => fs.readFileSync(path.join(root, file), 'utf8');

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'plm-electron-mocha-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ version: '13.1.0' }));
  for (const file of files) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    // Recover the registry form from an already patched installation as well.
    fs.writeFileSync(path.join(root, file), read(installed, file)
      .replace('shell: false', "shell: process.platform === 'win32'"));
  }
  return root;
}

test('Electron-Mocha install patch is repeatable and matches both installed files', t => {
  const root = fixture(t);
  patchElectronMocha(root);
  const first = files.map(file => read(root, file));
  patchElectronMocha(root);
  assert.deepEqual(files.map(file => read(root, file)), first);
  assert.deepEqual(files.map(file => read(installed, file)), first,
    'Run npm ci to apply the reviewed executable-spawn patch.');
});

test('Electron-Mocha version or source drift fails before either file is modified', t => {
  const root = fixture(t);
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ version: '13.1.1' }));
  assert.throws(() => patchElectronMocha(root), /Review.*version 13.1.1/);
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ version: '13.1.0' }));
  fs.appendFileSync(path.join(root, files[1]), '\n// upstream change\n');
  const before = files.map(file => read(root, file));
  assert.throws(() => patchElectronMocha(root), /Unexpected.*lib\/main.js/);
  assert.deepEqual(files.map(file => read(root, file)), before);
});

test('installed Electron-Mocha CLI preserves Windows argv, stdio, exit and signals without a shell', () => {
  const electron = 'C:\\Program Files\\Electron & Tools\\electron.exe';
  const dirname = 'C:\\checkout with spaces\\node_modules\\electron-mocha\\bin';
  const args = ['--grep', 'name with spaces & literal > output', '--config', 'C:\\tests & fixtures\\mocha.js'];
  const events = new Map();
  const childEvents = new Map();
  const piped = [];
  const killed = [];
  let call, exit, signal;
  const stream = { pipe: target => piped.push(target) };
  const child = {
    stdout: stream, stderr: stream, stdin: {},
    on: (name, handler) => childEvents.set(name, handler),
    kill: value => killed.push(value),
  };
  const processStub = {
    env: { ELECTRON_PATH: electron }, platform: 'win32', pid: 123,
    argv: ['node', 'electron-mocha', ...args],
    stdin: stream, stdout: {}, stderr: {},
    on: (name, handler) => events.set(name, handler),
    exit: value => { exit = value; },
    kill: (pid, value) => { signal = [pid, value]; },
  };
  vm.runInNewContext(read(installed, files[0]), {
    __dirname: dirname, process: processStub, console,
    require: name => {
      if (name === 'path') return path.win32;
      if (name === 'child_process') return { spawn: (...values) => { call = values; return child; } };
      throw new Error(`Unexpected require: ${name}`);
    },
  });
  assert.equal(call[0], electron);
  assert.deepEqual(Array.from(call[1]), [path.win32.join(dirname, '../lib/main.js'), ...args]);
  assert.equal(call[2].shell, false);
  assert.deepEqual(piped, [processStub.stdout, processStub.stderr, child.stdin]);
  childEvents.get('exit')(7, null);
  assert.equal(exit, 7);
  childEvents.get('exit')(null, 'SIGTERM');
  assert.deepEqual(signal, [123, 'SIGTERM']);
  events.get('SIGINT')();
  assert.deepEqual(killed, ['SIGINT', 'SIGTERM']);
});

test('installed Electron-Mocha cleanup directly spawns a detached executable with the original profile', () => {
  const dirname = 'C:\\checkout with spaces\\node_modules\\electron-mocha\\lib';
  const profile = 'C:\\Temp\\electron-mocha-profile & spaces';
  const executable = 'C:\\Program Files\\Electron\\electron.exe';
  const events = new Map();
  let call, unref = false, selectedProfile;
  const yargs = {};
  for (const name of ['scriptName', 'command', 'fail', 'help', 'alias', 'version', 'wrap', 'parserConfiguration', 'config', 'parse']) {
    yargs[name] = () => yargs;
  }
  const modules = {
    path: path.win32,
    fs: { mkdtempSync: () => profile },
    child_process: { spawn: (...values) => { call = values; return { unref: () => { unref = true; } }; } },
    electron: { app: {
      getPath: () => 'C:\\Temp',
      setPath: (name, value) => { selectedProfile = [name, value]; },
      on: (name, handler) => events.set(name, handler),
    } },
    '../package.json': { version: '13.1.0' },
    'yargs/yargs': () => yargs,
    'ansi-colors': {},
    'mocha/lib/cli/run-option-metadata': { types: { array: [], boolean: [] } },
    'mocha/lib/cli/options': { loadOptions: () => ({ _: [] }), YARGS_PARSER_CONFIG: {} },
    './run': {},
  };
  vm.runInNewContext(read(installed, files[1]), {
    __dirname: dirname, module: { paths: [] }, exports: {}, console,
    process: { platform: 'win32', argv: ['electron', 'main.js'], cwd: () => 'C:\\checkout with spaces', stdout: {}, execPath: executable },
    require: name => {
      assert.ok(Object.hasOwn(modules, name), `Unexpected require: ${name}`);
      return modules[name];
    },
  });
  assert.deepEqual(selectedProfile, ['userData', profile]);
  events.get('quit')();
  assert.equal(call[0], executable);
  assert.deepEqual(Array.from(call[1]), ['cleanup.js', profile]);
  assert.deepEqual(JSON.parse(JSON.stringify(call[2])), {
    detached: true, stdio: 'ignore', env: { ELECTRON_RUN_AS_NODE: 1 }, cwd: dirname, shell: false,
  });
  assert.equal(unref, true);
});
