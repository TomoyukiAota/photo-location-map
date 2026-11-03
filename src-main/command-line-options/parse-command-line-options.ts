import { Command, Option } from 'commander';
import { commandLineOptionsValue } from './command-line-options-value';

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
  commandLineOptionsValue.set(program.opts());
}
