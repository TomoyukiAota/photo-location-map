import * as electronUnhandled from 'electron-unhandled';
import { Logger } from '../src-shared/log/logger';

electronUnhandled({
  logger: error => {
    Logger.error(`error.name: ${error.name}, error.message: ${error.message}, error.stack: ${error.stack}`, error);
  },
  showDialog: true,
  // TODO: add reportButton???
});
