import { Command, Option } from 'commander';
import { Logger } from '../src-shared/log/logger';

const program = new Command();
program
  .addOption(new Option('--serve', 'Launch the app in live-reload mode for development.').hideHelp())
  .option('--open <path>',
    'When a folder is specified, the folder is opened after the app is launched. ' +
    'When a file is specified, the containing folder is opened after the app is launched.')
  .parse(process.argv, { from: 'electron' });

Logger.info('process.argv', process.argv);
Logger.info('program.opts()', program.opts());
