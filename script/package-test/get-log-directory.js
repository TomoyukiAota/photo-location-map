import path from 'path';

function parsePathWithWindowsEnvironmentVariable(path) {
  const parsed = path.replace(/%([^%]+)%/g, (_,n) => process.env[n]);
  return parsed;
}

function getAppDataDirectory() {
  if (process.env.PLM_TEST_ROOT) {
    return path.resolve(process.env.PLM_TEST_ROOT, 'appData');
  }
  switch(global.process.platform) {
    case 'win32':
      return parsePathWithWindowsEnvironmentVariable('%APPDATA%');
    case 'darwin':
      return `${process.env.HOME}/Library/Application Support`;
    case 'linux':
      return `${process.env.HOME}/.config`;
    default:
      throw new Error(`Unsupported platform for "${import.meta.filename}"`);
  }
}

function appendPhotoLocationMapLogLocation(appDataDirectory) {
  const appended = `${appDataDirectory}${path.sep}Photo Location Map${path.sep}logs`;
  return appended;
}

function getLogDirectory() {
  const appDataDirectory = getAppDataDirectory();
  const logDirectory = appendPhotoLocationMapLogLocation(appDataDirectory);
  return logDirectory;
}

export default getLogDirectory;
