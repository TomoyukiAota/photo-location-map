import assert = require('assert');
import { RequireFromMainProcess } from '../../../src-shared/require/require-from-main-process';

describe('RequireFromMainProcess (in main process)', () => {
  it('fsExtra should be require("fs-extra")', () => {
    assert(RequireFromMainProcess.fsExtra === require('fs-extra'));
  });

  it('os should be require("os")', () => {
    assert(RequireFromMainProcess.os === require('os'));
  });
});
