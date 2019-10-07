const child_process = require('child_process');

const runCommandSync = (command, startMsg, endMsg) => {
  console.info(startMsg);
  const stdout = child_process.execSync(command);
  console.info(stdout.toString());
  console.info(endMsg);
};

module.exports = runCommandSync;
