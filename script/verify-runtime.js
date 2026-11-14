import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import packageJson from '../package.json' with { type: 'json' };

const mise = fs.readFileSync(path.join(import.meta.dirname, '..', 'mise.toml'), 'utf8');
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
const expectedNpm = packageJson.engines?.npm;
if (expectedNpm && npmVersion !== expectedNpm) {
  throw new Error(`Expected bundled npm ${expectedNpm}; got ${npmVersion}. Reinstall the selected Node version.`);
}
console.info(`Node ${process.versions.node}; bundled npm ${npmVersion}`);
console.info(`Node executable: ${process.execPath}`);
console.info(`npm CLI: ${npmCli}`);

if (process.argv.includes('--electron')) {
  // Imported here: the electron package finds Electron's executable when it is loaded, which only this check needs.
  const { default: electronPath } = await import('electron');
  const result = spawnSync(electronPath, ['-e', 'console.log(JSON.stringify(process.versions))'], {
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }, encoding: 'utf8'
  });
  if (result.status !== 0) throw new Error(`Electron runtime probe failed: ${result.stderr}`);
  const versions = JSON.parse(result.stdout.trim());
  const expected = packageJson.devDependencies.electron;
  if (versions.electron !== expected) throw new Error(`Expected Electron ${expected}; got ${versions.electron}.`);
  const { default: { version: nodeTypes } } = await import('@types/node/package.json', { with: { type: 'json' } });
  if (versions.node.split('.')[0] !== nodeTypes.split('.')[0]) {
    throw new Error(`Node types ${nodeTypes} do not match Electron's Node ${versions.node}.`);
  }
  console.info(`Electron ${versions.electron}; embedded Node ${versions.node}; Chromium ${versions.chrome}`);
}
