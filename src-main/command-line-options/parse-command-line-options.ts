import { Command, Option } from 'commander';
import { commandLineOptionsValue } from './command-line-options-value';

export function parseCommandLineOptions() {
  const program = new Command();
  program
    .addOption(new Option('--live-reload', 'launch the app in live-reload mode for development').hideHelp())
    .option('--open <path>', 'open the specified file or folder after the app is launched')
    .parse(process.argv, { from: 'electron' });
  commandLineOptionsValue.set(program.opts());
}
