import { parseCommandLineOptions } from './parse-command-line-options.js';
import { setupIpcMainForCommandLineOptions } from './setup-ipc-main-for-command-line-options.js';

parseCommandLineOptions();
setupIpcMainForCommandLineOptions();
