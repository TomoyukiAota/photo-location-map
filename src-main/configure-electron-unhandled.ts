import * as electronUnhandled from 'electron-unhandled';
import { recordUnhandledError } from '../src-shared/analytics/record-error';
import { Logger } from '../src-shared/log/logger';

electronUnhandled({
  logger: error => {
    Logger.error(`error.name: ${error.name}, error.message: ${error.message}, error.stack: ${error.stack}`, error);
    recordUnhandledError(error, 'Main');
  },
  showDialog: true,
  // TODO: add reportButton???
});
