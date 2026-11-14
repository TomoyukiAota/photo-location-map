import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { runPackageTest } from '../../script/package-test/run-package-test.js';

async function checkRunner(options, verify) {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'plm-runner-cleanup-test-'));
  const providedRoot = path.join(fixtureRoot, 'caller-owned');
  fs.mkdirSync(providedRoot);
  fs.writeFileSync(path.join(providedRoot, 'keep.txt'), 'caller data');
  const runnerProcess = { env: options.providedRoot ? { PLM_TEST_ROOT: providedRoot } : {}, exitCode: undefined };
  const warnings = [];
  let selectedRoot;
  let removedRoot;
  let cleanupOptions;
  const fileSystem = {
    ...fs,
    rmSync(root, settings) {
      removedRoot = root;
      cleanupOptions = settings;
      if (options.failCleanup) throw new Error('simulated busy profile');
      fs.rmSync(root, settings);
    },
  };
  const modules = {
    '../util/logger.js': { info() {}, error() {}, warn: message => warnings.push(message) },
    './remove-previous-package-test-outcomes.js': () => {},
    './package-creation-test.js': { run() {
      fs.mkdirSync(path.join(selectedRoot, 'appData', 'cache'), { recursive: true });
      fs.writeFileSync(path.join(selectedRoot, 'appData', 'cache', 'session'), 'test session');
    } },
    './package-smoke-test.js': { async run() {
      if (options.switchRoot) runnerProcess.env.PLM_TEST_ROOT = providedRoot;
      if (options.failSmoke) throw new Error('simulated smoke failure');
    } },
  };
  try {
    await runPackageTest({
      runnerProcess, fileSystem, temporaryDirectory: fixtureRoot,
      async importModule(specifier) {
        // Loading these modules must already see the selected test profile.
        selectedRoot = runnerProcess.env.PLM_TEST_ROOT;
        assert.ok(selectedRoot);
        if (!(specifier in modules)) throw new Error(`Unexpected runner dependency: ${specifier}`);
        return { default: modules[specifier] };
      },
    });
    verify({ selectedRoot, removedRoot, cleanupOptions, providedRoot, runnerProcess, warnings });
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  }
}

test('successful package tests remove their own temporary profile', async () => {
  await checkRunner({}, ({ selectedRoot, removedRoot, cleanupOptions, runnerProcess }) => {
    assert.equal(runnerProcess.exitCode, 0);
    assert.equal(removedRoot, selectedRoot);
    assert.equal(fs.existsSync(selectedRoot), false);
    assert.equal(cleanupOptions.recursive, true);
    assert.equal(cleanupOptions.force, true);
    assert.equal(cleanupOptions.maxRetries, 5);
  });
});

test('failed package tests also remove their own profile and retain the failure', async () => {
  await checkRunner({ failSmoke: true }, ({ selectedRoot, removedRoot, runnerProcess }) => {
    assert.equal(runnerProcess.exitCode, 1);
    assert.equal(removedRoot, selectedRoot);
    assert.equal(fs.existsSync(selectedRoot), false);
  });
});

test('caller-supplied profiles survive successful and failed package tests', async () => {
  for (const failSmoke of [false, true]) {
    await checkRunner({ providedRoot: true, failSmoke }, ({ selectedRoot, removedRoot, providedRoot, runnerProcess }) => {
      assert.equal(runnerProcess.exitCode, failSmoke ? 1 : 0);
      assert.equal(selectedRoot, providedRoot);
      assert.equal(removedRoot, undefined);
      assert.equal(fs.readFileSync(path.join(providedRoot, 'keep.txt'), 'utf8'), 'caller data');
      assert.equal(fs.existsSync(path.join(providedRoot, 'appData', 'cache', 'session')), true);
    });
  }
});

test('cleanup targets the owned path even if the environment changes', async () => {
  await checkRunner({ switchRoot: true }, ({ selectedRoot, removedRoot, providedRoot }) => {
    assert.equal(removedRoot, selectedRoot);
    assert.equal(fs.existsSync(selectedRoot), false);
    assert.equal(fs.readFileSync(path.join(providedRoot, 'keep.txt'), 'utf8'), 'caller data');
  });
});

test('best-effort cleanup reports a busy profile without changing the test result', async () => {
  for (const failSmoke of [false, true]) {
    await checkRunner({ failCleanup: true, failSmoke }, ({ selectedRoot, runnerProcess, warnings }) => {
      assert.equal(runnerProcess.exitCode, failSmoke ? 1 : 0);
      assert.equal(fs.existsSync(selectedRoot), true);
      assert.equal(warnings.length, 1);
      assert.match(warnings[0], /simulated busy profile/);
    });
  }
});
