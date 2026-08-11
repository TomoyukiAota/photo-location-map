const child_process = require('child_process');
const logger = require('../util/logger');

// electron-builder requires the GH_TOKEN environment variable to publish to GitHub Releases.
//
// On CI, GH_TOKEN is provided by the workflow, so it is used as it is.
// On a local machine, it is obtained from the GitHub CLI. Thanks to this, a personal access token
// does not need to be stored in the environment of the local machine, where an expired token
// causes a confusing failure, and where it also overrides the credential of the GitHub CLI itself.
const getGitHubToken = () => {
  if (process.env.GH_TOKEN) {
    logger.info('Using the GH_TOKEN environment variable.');
    return process.env.GH_TOKEN;
  }

  logger.info('GH_TOKEN is not set. Obtaining the token by "gh auth token".');
  let token;
  try {
    token = child_process.execSync('gh auth token', {encoding: 'utf8'}).trim();
  } catch (error) {
    logger.error('Failed to run "gh auth token".');
    logger.error('Install the GitHub CLI and run "gh auth login", or set the GH_TOKEN environment variable.');
    throw error;
  }

  if (!token) {
    const errorMessage = '"gh auth token" succeeded but returned nothing.';
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  logger.info('Obtained the token by "gh auth token".');
  return token;
};

module.exports = getGitHubToken;
