import { parseCommandLineOptions } from './parse-command-line-options';
import { setupIpcMainForCommandLineOptions } from './setup-ipc-main-for-command-line-options';

const commandLineOptions = parseCommandLineOptions();
setupIpcMainForCommandLineOptions(commandLineOptions);
