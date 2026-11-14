import child_process from 'child_process';
import logger from './logger.js';

const runCommandSync = (command, startMsg, endMsg) => {
  logger.info(startMsg);
  try {
    // "inherit" is used to print the output while the command is running.
    // Without it, the output is captured and printed only when the command succeeds, which hides the reason of a failure.
    child_process.execSync(command, {stdio: 'inherit'});
  } catch (error) {
    logger.error(`Command failed: "${command}". Exit code: ${error.status}. Signal: ${error.signal}.`);
    throw error;
  }
  logger.info(endMsg);
};

export default runCommandSync;
