const child_process = require('child_process');
const logger = require('./logger');

const runCommandSync = (command, startMsg, endMsg) => {
  logger.info(startMsg);
  try {
    // "inherit" is used to print the output while the command is running.
    // Without it, the output is captured and printed only when the command succeeds, which hides the reason of a failure.
    child_process.execSync(command, {stdio: 'inherit'});
  } catch (error) {
    // The message of the error thrown by execSync is only "Command failed: <command>", and it contains neither
    // the exit code nor the signal. They are logged below because they are the only clue about the cause when
    // the command prints nothing on a failure, which is the case for the silent installation on Windows.
    logger.error(`Command failed: "${command}"`);
    logger.error(`Exit code: ${error.status}`);
    logger.error(`Signal: ${error.signal}`);
    throw error;
  }
  logger.info(endMsg);
};

module.exports = runCommandSync;
