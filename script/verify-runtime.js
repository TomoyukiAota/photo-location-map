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
