import assert from 'assert';
import { autoUpdateLogger } from '../../../src-main/auto-update/auto-update-logger.js';
import { logged } from '../../../src-shared/log/logged-line.js';
import { Logger } from '../../../src-shared/log/logger.js';

describe('autoUpdateLogger (in main process)', () => {
  // What it logs, without recording, as electron-updater's lines are.
  function capture(run: () => void): string[] {
    const lines: string[] = [];
    const original = { error: Logger.errorNotRecorded, warn: Logger.warnNotRecorded, recorded: Logger.warn };
    const keep = (message: unknown) => lines.push(String(message));
    Object.assign(Logger, { errorNotRecorded: keep, warnNotRecorded: keep, warn: keep });
    try {
      run();
    } finally {
      Object.assign(Logger, { errorNotRecorded: original.error, warnNotRecorded: original.warn, warn: original.recorded });
    }
    return lines;
  }

  it('should log an Error that electron-updater passes in place of a text, without throwing', () => {
    // electron-updater's MacUpdater passes the native updater's Error to warn() before it emits the error.
    const lines = capture(() => {
      autoUpdateLogger.warn(new Error('Could not get code signature for running application') as unknown as string);
      autoUpdateLogger.error(new Error('Network failure') as unknown as string);
    });

    assert.deepEqual(lines, ['[auto-update] Error: Could not get code signature for running application', '[auto-update] Error: Network failure']);
  });

  it('should keep a tagged line tagged, with the prefix', () => {
    const lines = capture(() => autoUpdateLogger.warnRecorded(logged`Cannot compare ${'macOS'} with ${'12.0'}`));

    assert.deepEqual(lines, ['[auto-update] Cannot compare macOS with 12.0']);
  });
});
