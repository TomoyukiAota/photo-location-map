import { Command, Option } from 'commander';
import { commandLineOptionsValue } from './command-line-options-value.js';

/** Reads the application's options from its command line into `commandLineOptionsValue`, for the renderer to ask for. */
export function parseCommandLineOptions() {
  const program = new Command();
  program
    .allowExcessArguments(true) // Preserve Commander 12's tolerance of unused positional arguments.
    // AppImage's launcher supplies this Electron runtime flag on Linux.
    .addOption(new Option('--no-sandbox').hideHelp())
    // The NSIS updater supplies this flag when restarting the installed app.
    .addOption(new Option('--updated').hideHelp())
    .addOption(new Option('--live-reload', 'launch the app in live-reload mode for development').hideHelp())
    .option('--open <path>', 'open the specified file or folder after the app is launched')
    .parse(process.argv, { from: 'electron' });
  const options = program.opts();
  if (typeof options.open === 'string') options.open = restoreTrailingBackslash(options.open);
  commandLineOptionsValue.set(options);
}

/**
 * TL;DR: On Windows, turns a trailing `"` back into the backslash that it was: `C:"` into `C:\`.
 * Details: The context menu of a folder's background in Explorer runs `"<exe>" --open "%V"`, and %V of a drive's root
 * ends with a backslash, so the command line has `--open "C:\"`. Windows reads that `\"` as a quotation mark inside
 * the argument (CommandLineToArgvW), which becomes `C:"`; a share's root such as `\\server\share\` becomes
 * `\\server\share"` alike. A path on Windows cannot contain `"`, so a trailing one can only be such a backslash.
 */
function restoreTrailingBackslash(path: string): string {
  return process.platform === 'win32' && path.endsWith('"') ? `${path.slice(0, -1)}\\` : path;
}
