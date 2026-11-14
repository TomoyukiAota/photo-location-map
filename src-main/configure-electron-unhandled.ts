// TL;DR: electron-unhandled stays at 4, a CommonJS package: version 6 would set its handlers after the setups that this
// file is imported before, and would show an error dialog for a window that is busy or crashes.
// Details: Version 6, an ES module, awaits its import of Electron at its top level. While it waits, Node evaluates the
// imports of electron-main.ts that follow this file, so an error of those setups would find no handler. Version 6 also
// handles a window whose page stops answering or whose renderer crashes, with no option to turn that off: it would show
// a dialog and record an unhandled error, where record-window-failures.ts and record-process-gone.ts record events and
// show nothing. Move to a version that sets its handlers synchronously and leaves the windows alone.
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
