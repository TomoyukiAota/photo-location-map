// Set only by test runners. Run before importing anything that caches Electron paths.
const testRoot = process.env.PLM_TEST_ROOT;
if (testRoot) {
  const { app } = require('electron');
  const path = require('path');
  const fs = require('fs');
  for (const name of ['appData', 'userData', 'sessionData']) {
    const directory = path.resolve(testRoot, name);
    fs.mkdirSync(directory, { recursive: true });
    app.setPath(name, directory);
  }
}
