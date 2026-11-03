const fs = require('fs');
const path = require('path');

const mise = fs.readFileSync(path.join(__dirname, '..', 'mise.toml'), 'utf8');
const nodeVersion = mise.match(/^node\s*=\s*"([^"]+)"/m)?.[1];
if (!nodeVersion || process.versions.node !== nodeVersion) {
  throw new Error(`Expected Node ${nodeVersion} from mise.toml; got ${process.versions.node}.`);
}

const npmCli = process.env.npm_execpath;
const bundledNpm = path.resolve(path.dirname(process.execPath),
  process.platform === 'win32' ? 'node_modules/npm' : '../lib/node_modules/npm');
const bundledNpmCli = path.join(bundledNpm, 'bin', 'npm-cli.js');
if (!npmCli || fs.realpathSync(npmCli) !== fs.realpathSync(bundledNpmCli)) {
  throw new Error('Run this check with the npm bundled with the selected Node installation.');
}
const npmVersion = JSON.parse(fs.readFileSync(path.join(bundledNpm, 'package.json'), 'utf8')).version;
const expectedNpm = require('../package.json').engines?.npm;
if (expectedNpm && npmVersion !== expectedNpm) {
  throw new Error(`Expected bundled npm ${expectedNpm}; got ${npmVersion}. Reinstall the selected Node version.`);
}
console.info(`Node ${process.versions.node}; bundled npm ${npmVersion}`);
console.info(`Node executable: ${process.execPath}`);
console.info(`npm CLI: ${npmCli}`);

if (process.argv.includes('--electron')) {
  const { spawnSync } = require('child_process');
  const result = spawnSync(require('electron'), ['-e', 'console.log(JSON.stringify(process.versions))'], {
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }, encoding: 'utf8'
  });
  if (result.status !== 0) throw new Error(`Electron runtime probe failed: ${result.stderr}`);
  const versions = JSON.parse(result.stdout.trim());
  const expected = require('../package.json').devDependencies.electron;
  if (versions.electron !== expected) throw new Error(`Expected Electron ${expected}; got ${versions.electron}.`);
  const nodeTypes = require('@types/node/package.json').version;
  if (versions.node.split('.')[0] !== nodeTypes.split('.')[0]) {
    throw new Error(`Node types ${nodeTypes} do not match Electron's Node ${versions.node}.`);
  }
  console.info(`Electron ${versions.electron}; embedded Node ${versions.node}; Chromium ${versions.chrome}`);
}
