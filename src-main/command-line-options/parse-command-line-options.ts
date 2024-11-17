import { Command, Option } from 'commander';
import { CommandLineOptions } from '../../src-shared/command-line-options/command-line-options';
import { Logger } from '../../src-shared/log/logger';

export function parseCommandLineOptions(): CommandLineOptions {
  const program = new Command();
  program
    .addOption(new Option('--serve', 'launch the app in live-reload mode for development').hideHelp())
    .option('--open <path>', 'open the specified file or folder after the app is launched')
    .parse(process.argv, { from: 'electron' });

  Logger.info('process.argv', process.argv);
  Logger.info('program.opts()', program.opts());
  return program.opts();
}
