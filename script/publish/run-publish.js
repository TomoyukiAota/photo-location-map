const child_process = require('child_process');
const logger = require('../util/logger');
const getGitHubToken = require('./get-github-token');

const supportedPlatforms = ['linux', 'mac', 'windows'];
const platform = process.argv[2];

if (!supportedPlatforms.includes(platform)) {
  logger.error(`Unsupported platform "${platform}".`);
  logger.error(`Usage: node ./script/publish/run-publish.js <${supportedPlatforms.join('|')}>`);
  process.exit(1);
}

// The token is passed as an environment variable, not as a command line argument,
// so that it does not appear in the process list nor in the error message of a failed command.
const command = `npm run electron-builder:${platform} -- --publish always`;
logger.info(`Start of "${command}" to create and publish a package.`);
child_process.execSync(command, {stdio: 'inherit', env: {...process.env, GH_TOKEN: getGitHubToken()}});
logger.info(`End of "${command}"`);
