import child_process from 'child_process';
import path from 'path';
import packageJson from '../../package.json' with { type: 'json' };
import logger from '../util/logger.js';
import { createDraftReleaseIfNone } from './draft-release.js';
import getGitHubToken from './get-github-token.js';

const supportedPlatforms = ['linux', 'mac', 'windows'];
const platform = process.argv[2];

if (!supportedPlatforms.includes(platform)) {
  logger.error(`Unsupported platform "${platform}".`);
  logger.error(`Usage: node ./script/publish/run-publish.js <${supportedPlatforms.join('|')}>`);
  process.exit(1);
}

const token = getGitHubToken();

// So that electron-builder does not split the files between two draft releases (draft-release.js).
await createDraftReleaseIfNone({projectDir: path.resolve(import.meta.dirname, '..', '..'), version: packageJson.version, token});

// The token is passed as an environment variable, not as a command line argument,
// so that it does not appear in the process list nor in the error message of a failed command.
const command = `npm run electron-builder:${platform} -- --publish always`;
logger.info(`Start of "${command}" to create and publish a package.`);
child_process.execSync(command, {stdio: 'inherit', env: {...process.env, GH_TOKEN: token}});
logger.info(`End of "${command}"`);
