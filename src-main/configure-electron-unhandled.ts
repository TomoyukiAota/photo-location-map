import electronUnhandled from 'electron-unhandled';
import { recordUnhandledError } from '../src-shared/analytics/record-error.js';
import { Logger } from '../src-shared/log/logger.js';

electronUnhandled({
  logger: error => {
    Logger.errorNotRecorded(`error.name: ${error.name}, error.message: ${error.message}, error.stack: ${error.stack}`, error);
    recordUnhandledError(error, 'Main');
  },
  showDialog: true,
  // TODO: add reportButton???
});
