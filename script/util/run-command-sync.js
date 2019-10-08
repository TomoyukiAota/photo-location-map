const child_process = require('child_process');
const logger = require('./logger');

const runCommandSync = (command, startMsg, endMsg) => {
  logger.info(startMsg);
  const stdout = child_process.execSync(command);
  console.info(stdout.toString());
  logger.info(endMsg);
};

module.exports = runCommandSync;
