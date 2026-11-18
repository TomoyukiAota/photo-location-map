import child_process from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import logger from '../util/logger.js';
import packageSmokeTest from './package-smoke-test.js';
import testInfo from './package-test-info.js';
import testUtil from './package-test-util.js';

// TL;DR: Checks on Windows, with the installer that the package test built and the application that it installed,
// that uninstalling the application deletes "Open with Photo Location Map" from the context menu of Explorer, that a
// key which it cannot delete does not stop it, and that an update keeps the menu (build/installer.nsh). CI runs it
// after the e2e suite (.github/workflows/ci-on-windows.yml).
// Details:
// - It writes the keys that the uninstaller deletes, and runs the installer again over the installed application, as
//   an update does: an installer runs the installed version's uninstaller with --updated, whether electron-updater or
//   the user starts it. That uninstaller must have run, which a file put in the installation's folder shows by being
//   gone, and the keys must still be there.
// - Then it uninstalls the application as its QuietUninstallString does, with two keys that the uninstaller fails to
//   delete. It deletes the second key, so that the uninstaller meets a key that is not there, as it meets all of them
//   for a user who never added the menu. It denies everyone the deletion of the third key, as an administrator can
//   deny it to the user. The uninstaller must end with 0 and remove the application. The third key must still be
//   there, or the test did not meet a key that cannot be deleted, and the other keys must be gone, with the third
//   key's subkey "command": DeleteRegKey deletes the subkeys before the key, so that subkey shows that the uninstaller
//   went on after the second key.
// - It runs only when PLM_UNINSTALLER_TEST is true, as the step of CI sets it: it reinstalls over and then uninstalls
//   the application installed for the user, and deletes keys of the context menu of Explorer without restoring them.
// - It covers an installation for the current user by an administrator, as on GitHub's runners. It does not cover an
//   installation for all users, an uninstaller elevated with another account, or an update from a version without
//   build/installer.nsh, whose uninstaller deletes no key.
// - The e2e suite runs a copy of the installed application, which it makes when it starts
//   (script/package-test/inspectable-package.js), so the application can be uninstalled after the suite.
// - After the update, it waits until it finds no process with the application's executable open, which the
//   uninstaller could not delete (waitUntilNoProcessHasOpen).

const installerScript = path.resolve(import.meta.dirname, '../../build/installer.nsh');
const regExe = path.win32.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'reg.exe');
// reg.exe cannot change the permissions of a key, which PowerShell can.
const powerShellExe = path.win32.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0',
  'powershell.exe');
const uninstallerFileName = 'Uninstall Photo Location Map.exe';
// A silent installation takes about 15 seconds on GitHub's runner. A run that hangs, as at a message box that a silent
// installer can still show, fails the test with the state of the installation rather than waiting for the job's
// timeout.
const installerTimeoutMs = 120000;
const uninstallerTimeoutMs = 120000;
// How long no process must have had the executable open before the uninstallation, and how long the test waits for
// that at most (waitUntilNoProcessHasOpen).
const unopenedForMs = 2000;
const unopenedTimeoutMs = 60000;

// Lists the processes that have a file open, as "<process id>\t<application's name>", through Windows' Restart Manager.
const fileHoldersSource = `
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;

public static class FileHolders {
  [StructLayout(LayoutKind.Sequential)]
  struct RM_UNIQUE_PROCESS {
    public int dwProcessId;
    public System.Runtime.InteropServices.ComTypes.FILETIME ProcessStartTime;
  }

  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  struct RM_PROCESS_INFO {
    public RM_UNIQUE_PROCESS Process;
    [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 256)] public string strAppName;
    [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 64)] public string strServiceShortName;
    public int ApplicationType;
    public uint AppStatus;
    public uint TSSessionId;
    [MarshalAs(UnmanagedType.Bool)] public bool bRestartable;
  }

  [DllImport("rstrtmgr.dll", CharSet = CharSet.Unicode)]
  static extern int RmStartSession(out uint handle, int flags, StringBuilder key);
  [DllImport("rstrtmgr.dll")]
  static extern int RmEndSession(uint handle);
  [DllImport("rstrtmgr.dll", CharSet = CharSet.Unicode)]
  static extern int RmRegisterResources(uint handle, uint nFiles, string[] files, uint nApplications,
    RM_UNIQUE_PROCESS[] applications, uint nServices, string[] services);
  [DllImport("rstrtmgr.dll")]
  static extern int RmGetList(uint handle, out uint needed, ref uint count, [In, Out] RM_PROCESS_INFO[] infos,
    ref uint rebootReasons);

  public static string[] Of(string path) {
    uint handle;
    // RmStartSession writes the session's key there: CCH_RM_SESSION_KEY (32) characters and a terminator.
    int result = RmStartSession(out handle, 0, new StringBuilder(33));
    if (result != 0) throw new InvalidOperationException("RmStartSession failed with " + result + ".");
    try {
      result = RmRegisterResources(handle, 1, new[] { path }, 0, null, 0, null);
      if (result != 0) throw new InvalidOperationException("RmRegisterResources failed with " + result + ".");
      uint needed;
      uint count = 0;
      uint reasons = 0;
      RM_PROCESS_INFO[] infos = null;
      // ERROR_MORE_DATA (234): infos is too small for the list, whose length is in needed. The list can grow between two
      // calls, as another process opens the file.
      for (int attempt = 1; ; attempt++) {
        result = RmGetList(handle, out needed, ref count, infos, ref reasons);
        if (result == 0) break;
        if (result != 234 || attempt == 5) throw new InvalidOperationException("RmGetList failed with " + result + ".");
        infos = new RM_PROCESS_INFO[needed];
        count = needed;
      }
      var holders = new List<string>();
      for (int i = 0; i < count; i++) holders.Add(infos[i].Process.dwProcessId + "\\t" + infos[i].strAppName);
      return holders.ToArray();
    } finally {
      RmEndSession(handle);
    }
  }
}
`;

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

/** Each of `keys` and its subkey "command". */
function withCommands(keys) {
  return keys.flatMap(key => [key, `${key}\\command`]);
}

/** Each of `keys`, with whether it is there. */
function keyStates(keys) {
  return keys.map(key => ({ key, isThere: reg(['query', key]).status === 0 }));
}

/**
 * Denies everyone the deletion of `key` when `isDenied` is true, and stops denying it otherwise. The denial is not
 * inherited, so the key's subkeys can still be deleted, and it applies to an administrator too, such as the account of
 * GitHub's runner. PowerShell changes the permissions through .NET, which takes the key's name as it is: PowerShell's
 * paths would take the "*" of the first key as a wildcard. The name is in an environment variable, not in the command.
 * Stopping the denial of a key that is not there does nothing.
 */
function setDeletionDenied(key, isDenied) {
  const root = 'HKCU\\';
  if (!key.startsWith(root)) throw new Error(`"${key}" is not under ${root}.`);
  const script = `
    $ErrorActionPreference = 'Stop'
    $rights = [System.Security.AccessControl.RegistryRights]
    $opened = [Microsoft.Win32.Registry]::CurrentUser.OpenSubKey($env:PLM_UNINSTALLER_TEST_KEY,
      [Microsoft.Win32.RegistryKeyPermissionCheck]::ReadWriteSubTree,
      $rights::ReadPermissions -bor $rights::ChangePermissions)
    $isDenied = $env:PLM_UNINSTALLER_TEST_DENY -eq 'true'
    if ($null -eq $opened) { if ($isDenied) { throw 'The key is not there.' } else { 'not there'; exit 0 } }
    # S-1-1-0 is Everyone, whose name depends on the language of Windows.
    $everyone = [System.Security.Principal.SecurityIdentifier]::new('S-1-1-0')
    $rule = [System.Security.AccessControl.RegistryAccessRule]::new($everyone, $rights::Delete, 'Deny')
    $permissions = $opened.GetAccessControl()
    if ($isDenied) { $permissions.AddAccessRule($rule) } else { [void]$permissions.RemoveAccessRule($rule) }
    $opened.SetAccessControl($permissions)
    $opened.Close()
  `;
  const result = child_process.spawnSync(powerShellExe, ['-NoProfile', '-NonInteractive', '-Command', script], {
    windowsHide: true, encoding: 'utf8',
    env: { ...process.env, PLM_UNINSTALLER_TEST_KEY: key.slice(root.length), PLM_UNINSTALLER_TEST_DENY: `${isDenied}` },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`PowerShell could not ${isDenied ? 'deny' : 'stop denying'} the deletion of "${key}" (exit code `
      + `${result.status}): ${result.stderr.trim()}`);
  }
  if (result.stdout.trim() === 'not there') {
    logger.info(`${key} is not there, so its deletion is not denied.`);
  } else {
    logger.info(isDenied ? `Denied everyone the deletion of ${key}.` : `Stopped denying the deletion of ${key}.`);
  }
}

/**
 * Looks, every 100 ms, at which processes have `file` open, until none of the looks has found one for `unopenedFor` ms
 * since the first that found none, or `timeout` ms have passed, and returns { unopened, waitedMs, seen, now }: whether
 * the looks found none for that long, how long it took, every process that they found and those that the last found,
 * each as "<process id> <name> (<application's name>)". With 0 and 0, it looks once. The looks are samples: a process
 * that opens the file and lets it go between two of them is not seen.
 */
function processesThatHaveOpen(file, { unopenedFor, timeout }) {
  const script = `
    $ErrorActionPreference = 'Stop'
    # Node reads the output as UTF-8, and a process's name can be in any language.
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    Add-Type -TypeDefinition $env:PLM_UNINSTALLER_TEST_HOLDERS_SOURCE
    $unopenedFor = [int]$env:PLM_UNINSTALLER_TEST_UNOPENED_FOR
    $timeout = [int]$env:PLM_UNINSTALLER_TEST_TIMEOUT
    function Describe($holders) {
      foreach ($holder in $holders) {
        $id, $application = $holder -split "\`t", 2
        $process = Get-Process -Id $id -ErrorAction SilentlyContinue
        "$id $(if ($process) { $process.ProcessName } else { '(ended)' }) ($application)"
      }
    }
    $clock = [System.Diagnostics.Stopwatch]::StartNew()
    # When the first of the looks since the last that found a process found none.
    $emptySince = $null
    $seen = [System.Collections.Generic.SortedSet[string]]::new()
    while ($true) {
      $holders = [FileHolders]::Of($env:PLM_UNINSTALLER_TEST_FILE)
      $now = @(Describe $holders)
      foreach ($each in $now) { [void]$seen.Add($each) }
      if ($holders.Length -gt 0) { $emptySince = $null } elseif ($null -eq $emptySince) { $emptySince = $clock.ElapsedMilliseconds }
      $unopened = $null -ne $emptySince -and $clock.ElapsedMilliseconds - $emptySince -ge $unopenedFor
      if ($unopened -or $clock.ElapsedMilliseconds -ge $timeout) { break }
      Start-Sleep -Milliseconds 100
    }
    [pscustomobject]@{ unopened = $unopened; waitedMs = $clock.ElapsedMilliseconds; seen = @($seen); now = $now } |
      ConvertTo-Json -Compress
  `;
  // Beyond the looks, PowerShell takes a few seconds to start and to compile the source of Add-Type.
  const processTimeout = timeout + 60000;
  const result = child_process.spawnSync(powerShellExe, ['-NoProfile', '-NonInteractive', '-Command', script], {
    windowsHide: true, encoding: 'utf8', timeout: processTimeout,
    env: {
      ...process.env, PLM_UNINSTALLER_TEST_HOLDERS_SOURCE: fileHoldersSource, PLM_UNINSTALLER_TEST_FILE: file,
      PLM_UNINSTALLER_TEST_UNOPENED_FOR: `${unopenedFor}`, PLM_UNINSTALLER_TEST_TIMEOUT: `${timeout}`,
    },
  });
  if (result.error?.code === 'ETIMEDOUT') {
    throw new Error(`PowerShell did not list the processes that have "${file}" open in ${processTimeout} ms.`);
  }
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`PowerShell could not list the processes that have "${file}" open (exit code ${result.status}): `
      + `${result.stderr.trim()}`);
  }
  const looked = JSON.parse(result.stdout);
  // ConvertTo-Json writes an array of one as its element, and an empty one as null.
  const list = value => (value === null || value === undefined ? [] : [value].flat());
  return { ...looked, seen: list(looked.seen), now: list(looked.now) };
}

/**
 * TL;DR: Waits until looks every 100 ms have found no process with the application's executable open for 2 seconds,
 * as the uninstaller cannot delete it while one has it open.
 * Details:
 * - The uninstaller removes the installation's folder with RMDir /r, which leaves a file that a process has open
 *   without telling (electron-builder's templates/nsis/uninstaller.nsh). This test failed so now and then, on 2 of the
 *   33 runs on GitHub's runner from 2026-11-17 to 2026-11-18, both after the e2e suite: only the executable was left.
 * - In 30 runs of this test on the runner without the e2e suite, which Restart Manager watched, a process with the
 *   installer's description still had the new executable open for up to 1.6 seconds after the installer's command had
 *   ended (7 runs), and the uninstallation started 0.25 to 0.47 seconds after it let go. Explorer opened the executable
 *   for 0.2 seconds about half a second after an installation, once during the uninstallation. Defender scans nothing
 *   on the runner: its real-time protection is off, and C:\ and D:\ are excluded.
 * - In 15 more runs that uninstalled at once after the update, the executable was never left either, so the failure
 *   was not reproduced; in 15 with this wait, Explorer had the executable open twice, which it waited 2.2 seconds for.
 *   What was seen is a time when a process has the executable open, which the uninstallation can meet. This wait
 *   lets that time pass: the looks are samples, so a process can still open the executable between two of them, or after
 *   the last, while the test changes the keys before uninstalling, but those seen let go within 2 seconds of an
 *   installation. Should the executable be left all the same, the test's message names the processes that have it
 *   open then.
 * - A user does not uninstall the application the moment that it is installed, so this waits rather than retries.
 */
function waitUntilNoProcessHasOpen(applicationExe) {
  const { unopened, waitedMs, seen, now } = processesThatHaveOpen(applicationExe,
    { unopenedFor: unopenedForMs, timeout: unopenedTimeoutMs });
  if (!unopened) {
    throw new Error(`"${applicationExe}" is still open after ${waitedMs} ms, by ${now.join(', ') || 'a process that '
      + 'let it go too late'}, so the uninstaller could not delete it.`);
  }
  logger.info(seen.length === 0
    ? `No look in ${waitedMs} ms found a process with "${applicationExe}" open after the update.`
    : `Waited ${waitedMs} ms, until no look had found a process with "${applicationExe}" open for ${unopenedForMs} ms. `
      + `These had it open: ${seen.join(', ')}.`);
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
  waitUntilNoProcessHasOpen(applicationExe);
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
    for (const { key, isThere } of keyStates(withCommands(keys))) {
      logger.info(`${isThere ? 'There' : 'Not there'}: ${key}`);
    }
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
  if (keys.length < 3) {
    throw new Error(`"${installerScript}" deletes ${keys.length} key(s), where the test needs three or more: it leaves `
      + 'the second out and denies the deletion of the third.');
  }
  // The second key and the third, so that the first, the menu on every file, is still checked.
  const [missingKey, protectedKey] = keys.slice(1, 3);

  try {
    addKeys(keys, applicationExe);
    update(installationDirectory, applicationExe);
    checkKeys(withCommands(keys), true, 'Missing after the update, which must keep them, so the uninstaller that the '
      + 'installer ran with --updated deleted them (build/installer.nsh)');

    const deleted = reg(['delete', missingKey, '/f']);
    if (deleted.status !== 0) {
      throw new Error(`reg.exe could not delete "${missingKey}" (exit code ${deleted.status}): ${deleted.stderr.trim()}`);
    }
    logger.info(`Deleted ${missingKey}, so that the uninstaller meets a key that is not there.`);
    setDeletionDenied(protectedKey, true);
    uninstall(installationDirectory);
    if (fs.existsSync(applicationExe)) {
      // The processes that have the executable open are told if they can be listed: the failure is the executable.
      let holders;
      try {
        const { now } = processesThatHaveOpen(applicationExe, { unopenedFor: 0, timeout: 0 });
        holders = now.length > 0 ? `open by ${now.join(', ')}` : 'open by no process now';
      } catch (error) {
        holders = `the processes that have it open could not be listed: ${error.message}`;
      }
      throw new Error(`"${applicationExe}" is still there after uninstalling (${holders}).`);
    }
    checkKeys([protectedKey], true, 'Gone after uninstalling, though its deletion was denied, so the test did not check '
      + 'a key that the uninstaller cannot delete');
    checkKeys(withCommands(keys).filter(key => key !== protectedKey), false, 'Still there after uninstalling, so the '
      + 'uninstaller did not delete them, or stopped at a key that it could not delete (customUnInstall in '
      + 'build/installer.nsh)');
  } catch (error) {
    printState(installationDirectory, keys);
    throw error;
  } finally {
    // Before the keys are deleted, as the third could not be.
    try {
      setDeletionDenied(protectedKey, false);
    } catch (error) {
      logger.warn(error.message);
    }
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
