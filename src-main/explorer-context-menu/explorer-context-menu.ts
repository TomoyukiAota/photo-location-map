import * as childProcess from 'child_process';
import * as path from 'path';
import { Analytics } from '../../src-shared/analytics/analytics';
import { scrubbedErrorLabel } from '../../src-shared/analytics/record-error';
import { t } from '../../src-shared/i18n/i18n';
import { Logger } from '../../src-shared/log/logger';

/** A value of a registry key, `name` null for the key's default value. */
export interface RegistryValue {
  key: string;
  name: string | null;
  data: string;
}

/** Runs reg.exe with the arguments, and rejects when it fails. */
export type RunReg = (args: readonly string[]) => Promise<void>;

/** A failure of reg.exe: what failed and how in `message`, which goes to analytics, and the rest for the log only. */
export interface RegFailure extends Error {
  /** The key that reg.exe was run on. */
  key?: string;
  /** What reg.exe wrote, in the language of Windows: as text when it is UTF-8, else its bytes in hex. */
  output?: string;
}

// The context menu items of Explorer, which Explorer shows under "Show more options" on Windows 11: for files, for
// folders and for the background of a folder, each with what Explorer replaces with the path of the item.
const menuItems = [
  { key: 'HKCU\\Software\\Classes\\*\\shell\\OpenWithPhotoLocationMap', placeholder: '%1' },
  { key: 'HKCU\\Software\\Classes\\Directory\\shell\\OpenWithPhotoLocationMap', placeholder: '%1' },
  { key: 'HKCU\\Software\\Classes\\Directory\\Background\\shell\\OpenWithPhotoLocationMap', placeholder: '%V' },
];

/** The keys that Add creates and Remove deletes. */
export const explorerContextMenuKeys: readonly string[] = menuItems.map(item => item.key);

/** A key that is always there, which reg.exe can query whenever it works at all. */
const keyThatIsAlwaysThere = 'HKCU\\Software';

/**
 * reg.exe of Windows, by its full path. By its name alone, it would be looked for in the current folder first, and the
 * application runs in the folder that Explorer opened it from, which can hold any program named reg.exe.
 */
export const regExePath = path.win32.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'reg.exe');

/**
 * What Add writes for the application at `exePath`, in that order. The item's text is in the application's language
 * at that time; after the language changes, Remove and Add write it again.
 */
export function explorerContextMenuValues(exePath: string): RegistryValue[] {
  return menuItems.flatMap(({ key, placeholder }) => [
    // The letter after & is the item's access key in Explorer's menu.
    { key, name: null, data: t('explorerContextMenu.openWithAccessKey') },
    { key, name: 'icon', data: exePath },
    // Quoted, as the path has spaces. Unquoted, CreateProcess takes the part before each space in turn as the program,
    // trying "...\Photo.exe" and "...\Photo Location.exe" before "...\Photo Location Map.exe".
    { key: `${key}\\command`, name: null, data: `"${exePath}" --open "${placeholder}"` },
  ]);
}

/**
 * Runs reg.exe without a console window. The application has no console, so Windows would open one for each run
 * otherwise; that is what `windowsHide` prevents.
 */
export const runReg: RunReg = args => new Promise((resolve, reject) => {
  childProcess.execFile(regExePath, args, { windowsHide: true, encoding: 'buffer' }, (error, _stdout, stderr) => {
    if (error) {
      // The message goes to analytics, so it has neither the command line, with the user's paths, nor reg.exe's text.
      const how = typeof error.code === 'number' ? `exit code ${error.code}` : error.code ?? error.signal ?? 'no exit code';
      reject(Object.assign(new Error(`reg.exe ${args[0]} failed (${how})`), { key: args[1], output: textOf(stderr) }));
    } else {
      resolve();
    }
  });
});

/**
 * What reg.exe wrote, as text when it is UTF-8. Windows in some languages, such as Japanese, writes it in another code
 * page, which Node cannot tell, so the bytes are kept in hex then, to be read later.
 */
function textOf(bytes: Buffer): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes).trim();
  } catch {
    return `(not UTF-8, in hex) ${bytes.toString('hex')}`;
  }
}

let previousChange: Promise<unknown> = Promise.resolve();

/**
 * Runs `change` once the previous change has finished, whether it worked or not. A Remove clicked during an Add then
 * waits for it, so the registry and the message end as the last click asked.
 */
export function afterPreviousChange<T>(change: () => Promise<T>): Promise<T> {
  const result = previousChange.then(change);
  previousChange = result.catch(() => undefined);
  return result;
}

/** Adds "Open with Photo Location Map" in the context menu of Explorer, for the application at `exePath`. */
export async function addExplorerContextMenu(exePath: string, run: RunReg = runReg): Promise<void> {
  try {
    for (const { key, name, data } of explorerContextMenuValues(exePath)) {
      await run(['add', key, ...(name === null ? ['/ve'] : ['/v', name]), '/t', 'REG_SZ', '/d', data, '/f']);
    }
  } catch (error) {
    Logger.errorNotRecorded(`[Registry] Failed to add the registry keys for the Explorer's context menu: ${failureText(error)}`);
    Analytics.trackEvent('Registry', '[Registry] Add Explorer Context Menu: Error', scrubbedErrorLabel(error));
    throw error;
  }
  Logger.info('[Registry] Added the registry keys for the Explorer\'s context menu.');
  Analytics.trackEvent('Registry', '[Registry] Add Explorer Context Menu');
}

/** Removes "Open with Photo Location Map" from the context menu of Explorer. A key that is not there is fine. */
export async function removeExplorerContextMenu(run: RunReg = runReg): Promise<void> {
  try {
    for (const key of explorerContextMenuKeys) {
      await deleteKey(key, run);
    }
  } catch (error) {
    Logger.errorNotRecorded(`[Registry] Failed to delete the registry keys for the Explorer's context menu: ${failureText(error)}`);
    Analytics.trackEvent('Registry', '[Registry] Remove Explorer Context Menu: Error', scrubbedErrorLabel(error));
    throw error;
  }
  Logger.info('[Registry] Deleted the registry keys for the Explorer\'s context menu.');
  Analytics.trackEvent('Registry', '[Registry] Remove Explorer Context Menu');
}

/** Deletes `key` with its subkeys, and rejects only if it is still there or reg.exe does not work. */
async function deleteKey(key: string, run: RunReg): Promise<void> {
  try {
    await run(['delete', key, '/f']);
  } catch (error) {
    // reg.exe exits with 1 both when the key is not there and when it cannot delete it, with a message in the language
    // of Windows, so ask whether the key is still there. When reg.exe cannot answer that even for a key that is always
    // there, it does not work at all, as when it cannot start or the policy against registry tools is on.
    if (await succeeds(['query', key], run) || !await succeeds(['query', keyThatIsAlwaysThere, '/ve'], run)) throw error;
  }
}

/** Whether reg.exe succeeds with `args`, as a query does for a key that is there. */
async function succeeds(args: readonly string[], run: RunReg): Promise<boolean> {
  try {
    await run(args);
    return true;
  } catch {
    return false;
  }
}

/** The message of an error, with the key and what reg.exe wrote, for the log file, which stays on the user's computer. */
function failureText(error: unknown): string {
  const { key, output } = (error ?? {}) as RegFailure;
  return [String(error), key, output].filter(Boolean).join(': ');
}
