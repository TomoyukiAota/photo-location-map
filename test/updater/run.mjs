// Launch a separate Electron process; never import the application's main entry.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import electronPath from 'electron';

async function main() {
  assert.equal(process.platform, 'darwin', 'This integration check exercises MacUpdater on macOS.');
  const repository = path.resolve(import.meta.dirname, '../..');
  const options = {};
  for (let index = 2; index < process.argv.length; index += 2) {
    const option = process.argv[index];
    assert.ok(['--artifact', '--report'].includes(option) && process.argv[index + 1],
      'Usage: node test/updater/run.mjs [--artifact release/candidate.zip] [--report .upgrade-artifacts/report.json]');
    options[option.slice(2)] = process.argv[index + 1];
  }
  const suppliedArtifact = options.artifact || process.env.PLM_UPDATER_ARTIFACT;
  let artifact;
  if (suppliedArtifact) {
    artifact = fs.realpathSync(path.resolve(repository, suppliedArtifact));
    const relative = path.relative(repository, artifact);
    assert.ok(['release' + path.sep, '.upgrade-artifacts' + path.sep].some(prefix => relative.startsWith(prefix)),
      'The explicitly provided artifact must be under this checkout\'s release/ or .upgrade-artifacts/.');
    assert.ok(fs.statSync(artifact).isFile() && artifact.endsWith('.zip'), 'Expected an existing ZIP artifact.');
  }
  let reportPath;
  if (options.report) {
    reportPath = path.resolve(repository, options.report);
    assert.ok(path.relative(path.join(repository, '.upgrade-artifacts'), reportPath).split(path.sep)[0] !== '..',
      'Reports must stay inside the ignored .upgrade-artifacts directory.');
    assert.notEqual(reportPath, path.join(repository, '.upgrade-artifacts'));
    if (artifact) {
      const artifactStat = fs.statSync(artifact, { bigint: true });
      const reportStat = fs.statSync(reportPath, { bigint: true, throwIfNoEntry: false });
      // File identity also catches symlinks, hard links and case-insensitive aliases.
      assert.ok(!reportStat || reportStat.dev !== artifactStat.dev || reportStat.ino !== artifactStat.ino,
        'The report destination must not refer to the supplied ZIP artifact.');
    }
  }

  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'plm-updater-')));
  const nonce = crypto.randomBytes(24).toString('hex');
  fs.writeFileSync(path.join(root, 'owner.json'), JSON.stringify({ kind: 'plm-updater-integration', nonce }), { mode: 0o600 });
  // Pass only operating-system launch settings, without publishing/signing credentials.
  const environment = {};
  for (const name of ['PATH', 'HOME', 'LANG', 'LC_ALL', 'LC_CTYPE', 'TZ', 'TMPDIR']) {
    if (process.env[name] !== undefined) environment[name] = process.env[name];
  }
  Object.assign(environment, {
    PLM_UPDATER_TEST_ROOT: root,
    PLM_UPDATER_TEST_NONCE: nonce,
    PLM_UPDATER_ARTIFACT: artifact || '',
  });
  let timer;
  try {
    const child = spawn(electronPath, [path.join(import.meta.dirname, 'electron-main.mjs')], {
      cwd: repository, env: environment, stdio: ['ignore', 'inherit', 'inherit'],
    });
    timer = setTimeout(() => child.kill('SIGKILL'), 180000);
    const code = await new Promise((resolve, reject) => {
      child.once('error', reject);
      child.once('exit', (exitCode, signal) => {
        if (signal) reject(new Error(`Updater test exited with signal ${signal}.`));
        else resolve(exitCode);
      });
    });
    assert.equal(code, 0, 'Isolated updater integration failed.');
    const report = fs.readFileSync(path.join(root, 'report.json'), 'utf8');
    if (reportPath) {
      fs.mkdirSync(path.dirname(reportPath), { recursive: true });
      fs.writeFileSync(reportPath, report);
    }
    process.stdout.write(report);
  } finally {
    clearTimeout(timer);
    fs.rmSync(root, { recursive: true, force: true });
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
