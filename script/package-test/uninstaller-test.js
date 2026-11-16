import child_process from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import logger from '../util/logger.js';
import packageSmokeTest from './package-smoke-test.js';
import testInfo from './package-test-info.js';
import testUtil from './package-test-util.js';

// TL;DR: Checks on Windows, with the installer that the package test built and the application that it installed,
// that uninstalling the application deletes "Open with Photo Location Map" from the context menu of Explorer, and that
// an update keeps it (build/installer.nsh). CI runs it after the e2e suite (.github/workflows/ci-on-windows.yml).
// Details:
// - It writes the keys that the uninstaller deletes, and runs the installer again over the installed application, as
//   an update does: an installer runs the installed version's uninstaller with --updated, whether electron-updater or
//   the user starts it. That uninstaller must have run, which a file put in the installation's folder shows by being
//   gone, and the keys must still be there. Then it deletes the second key, so that the uninstaller meets a key that
//   is not there, as it meets all of them for a user who never added the menu, and must still delete the one after it.
//   It uninstalls the application as its QuietUninstallString does, and the keys must be gone.
// - It runs only when PLM_UNINSTALLER_TEST is true, as the step of CI sets it: it reinstalls over and then uninstalls
//   the application installed for the user, and deletes keys of the context menu of Explorer without restoring them.
// - It covers an installation for the current user by an administrator, as on GitHub's runners. It does not cover an
//   installation for all users, an uninstaller elevated with another account, or an update from a version without
//   build/installer.nsh, whose uninstaller deletes no key.
// - The e2e suite runs a copy of the installed application, which it makes when it starts
//   (script/package-test/inspectable-package.js), so the application can be uninstalled after the suite.

const installerScript = path.resolve(import.meta.dirname, '../../build/installer.nsh');
const regExe = path.win32.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'reg.exe');
const uninstallerFileName = 'Uninstall Photo Location Map.exe';
// A silent installation takes about 15 seconds on GitHub's runner. A run that hangs, as at a message box that a silent
// installer can still show, fails the test with the state of the installation rather than waiting for the job's
// timeout.
const installerTimeoutMs = 120000;
const uninstallerTimeoutMs = 120000;

/** The keys that build/installer.nsh deletes, named as reg.exe names them. */
function keysThatTheUninstallerDeletes() {
  const script = fs.readFileSync(installerScript, 'utf8');
  return [...script.matchAll(/^ *DeleteRegKey HKCU "([^"]+)"\r?$/gm)].map(match => `HKCU\\${match[1]}`);
}

/** Runs reg.exe with `args`, and returns its result, with its exit code in `status`. */
function reg(args) {
  const result = child_process.spawnSync(regExe, args, { windowsHide: true, encoding: 'utf8' });
  if (result.error) throw result.error;
  return result;
}

/** Each of `keys` and its subkey "command", with whether it is there. */
function keyStates(keys) {
  return keys.flatMap(key => [key, `${key}\\command`]).map(key => ({ key, isThere: reg(['query', key]).status === 0 }));
}

/**
 * Writes each of `keys` with its subkey "command", for `applicationExe`. DeleteRegKey deletes a key with its subkeys
 * whatever their values, so these are only like the values that the OS tab's Add writes.
 */
function addKeys(keys, applicationExe) {
  for (const key of keys) {
    const values = [[key, 'Open with &Photo Location Map'], [`${key}\\command`, `"${applicationExe}" --open "%1"`]];
    for (const [subkey, data] of values) {
      const result = reg(['add', subkey, '/ve', '/t', 'REG_SZ', '/d', data, '/f']);
      if (result.status !== 0) {
        throw new Error(`reg.exe could not add "${subkey}" (exit code ${result.status}): ${result.stderr.trim()}`);
      }
    }
  }
  logger.info(`Added ${keys.join(', ')}, each with its subkey "command".`);
}

/** Throws `failure`, with the keys that are not as `isThere` says, unless every key is. */
function checkKeys(keys, isThere, failure) {
  const wrong = keyStates(keys).filter(state => state.isThere !== isThere).map(state => state.key);
  if (wrong.length > 0) throw new Error(`${failure}: ${wrong.join(', ')}`);
  logger.info(`Every key is ${isThere ? 'there' : 'gone'}.`);
}

/**
 * Runs the installer over the installed application, as an update does, and throws unless the installed version's
 * uninstaller ran: it removes the files of the installation's folder, which the installer then fills again.
 */
function update(installationDirectory, applicationExe) {
  const marker = path.join(installationDirectory, 'uninstaller-test-marker.txt');
  fs.writeFileSync(marker, 'The uninstaller that an installer runs over this installation removes this file.\n');
  logger.info('Running the installer over the installed application, as an update does.');
  // On Windows, the command that the smoke test runs before the application is the silent installation, which it
  // retries when the installer crashes. A reinstallation reads its folder from the registry, so it should not reach
  // the call that crashes (PackageSmokeTest::runExecutablePrelaunchCommand).
  packageSmokeTest.runExecutablePrelaunchCommand({ timeout: installerTimeoutMs });
  if (fs.existsSync(marker)) {
    throw new Error(`"${marker}" is still there: the installer did not run the installed version's uninstaller, so `
      + 'the update is not checked.');
  }
  if (!fs.existsSync(applicationExe)) throw new Error(`"${applicationExe}" does not exist after the update.`);
}

/**
 * Uninstalls the application with the arguments of its QuietUninstallString, "/currentuser /S", and returns when it has.
 * Started from the installation's folder, the uninstaller would start a copy of itself in the temporary folder and end
 * at once. It is run as that copy is, from a copy, with _?= naming the installation's folder, so that it ends when it
 * has uninstalled, as an installer runs the installed version's uninstaller (uninstallOldVersion in electron-builder's
 * templates/nsis/include/installUtil.nsh).
 */
function uninstall(installationDirectory) {
  const copyDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'plm-uninstaller-'));
  const copy = path.join(copyDirectory, uninstallerFileName);
  try {
    fs.copyFileSync(path.join(installationDirectory, uninstallerFileName), copy);
    logger.info(`Uninstalling the application with "${copy}".`);
    // NSIS reads _?= only as the last argument and unquoted, so the command line is passed as it is, with the copy's
    // path quoted in argv0.
    const result = child_process.spawnSync(copy, ['/currentuser', '/S', `_?=${installationDirectory}`], {
      argv0: `"${copy}"`, windowsVerbatimArguments: true, windowsHide: true, stdio: 'inherit', timeout: uninstallerTimeoutMs,
    });
    if (result.error?.code === 'ETIMEDOUT') throw new Error(`The uninstaller did not end in ${uninstallerTimeoutMs} ms.`);
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`The uninstaller exited with ${result.status}.`);
  } finally {
    try {
      fs.rmSync(copyDirectory, { recursive: true, force: true, maxRetries: 5, retryDelay: 1000 });
    } catch (error) {
      logger.warn(`Could not remove "${copyDirectory}": ${error.message}`);
    }
  }
}

/** Prints what tells why the test failed: the files of the installation's folder, and which keys are there. */
function printState(installationDirectory, keys) {
  try {
    testUtil.printItemsInDirectory(installationDirectory);
    for (const { key, isThere } of keyStates(keys)) logger.info(`${isThere ? 'There' : 'Not there'}: ${key}`);
  } catch (error) {
    logger.warn(`Could not print the state of the installation: ${error.message}`);
  }
}

function runUninstallerTest() {
  logger.info('Start of uninstaller test.');
  if (process.platform !== 'win32') throw new Error('The uninstaller test checks the installer for Windows.');
  if (process.env.PLM_UNINSTALLER_TEST !== 'true') {
    throw new Error('The uninstaller test reinstalls over and then uninstalls the application installed for this user, '
      + 'and deletes keys of the context menu of Explorer without restoring them, so it runs only when '
      + 'PLM_UNINSTALLER_TEST is true, as in CI on Windows (.github/workflows/ci-on-windows.yml).');
  }
  const installationDirectory = path.resolve(testInfo.installationDirectory);
  const applicationExe = path.join(installationDirectory, 'Photo Location Map.exe');
  if (!fs.existsSync(applicationExe)) {
    throw new Error(`"${applicationExe}" does not exist: run the package test first, which installs the application.`);
  }
  const keys = keysThatTheUninstallerDeletes();
  if (keys.length < 2) {
    throw new Error(`"${installerScript}" deletes ${keys.length} key(s), where the test needs two or more: it leaves `
      + 'the second out.');
  }

  try {
    addKeys(keys, applicationExe);
    update(installationDirectory, applicationExe);
    checkKeys(keys, true, 'Missing after the update, which must keep them, so the uninstaller that the installer ran '
      + 'with --updated deleted them (build/installer.nsh)');

    // The second key, so that the first, the menu on every file, is still checked.
    const missingKey = keys[1];
    const deleted = reg(['delete', missingKey, '/f']);
    if (deleted.status !== 0) {
      throw new Error(`reg.exe could not delete "${missingKey}" (exit code ${deleted.status}): ${deleted.stderr.trim()}`);
    }
    logger.info(`Deleted ${missingKey}, so that the uninstaller meets a key that is not there.`);
    uninstall(installationDirectory);
    if (fs.existsSync(applicationExe)) throw new Error(`"${applicationExe}" is still there after uninstalling.`);
    checkKeys(keys, false, 'Still there after uninstalling, so the uninstaller did not delete them (customUnInstall in '
      + 'build/installer.nsh)');
  } catch (error) {
    printState(installationDirectory, keys);
    throw error;
  } finally {
    for (const key of keys) {
      try {
        reg(['delete', key, '/f']);
      } catch (error) {
        logger.warn(`Could not delete "${key}": ${error.message}`);
      }
    }
  }
  logger.info('End of uninstaller test.');
}

// Run by `npm run test:uninstaller`.
if (import.meta.main) {
  try {
    runUninstallerTest();
  } catch (error) {
    logger.error(error?.stack ?? error);
    logger.error('End of uninstaller test with some errors.');
    process.exitCode = 1;
  }
}
