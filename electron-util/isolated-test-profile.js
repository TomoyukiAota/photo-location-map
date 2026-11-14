// Set only by test runners. Run before importing anything that caches Electron paths.
import { app } from 'electron';
import fs from 'fs';
import path from 'path';

const testRoot = process.env.PLM_TEST_ROOT;
if (testRoot) {
  for (const name of ['appData', 'userData', 'sessionData']) {
    const directory = path.resolve(testRoot, name);
    fs.mkdirSync(directory, { recursive: true });
    app.setPath(name, directory);
  }
}
