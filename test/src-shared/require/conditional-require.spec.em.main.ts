import assert = require('assert');
import { ConditionalRequire } from '../../../src-shared/require/conditional-require';

describe('ConditionalRequire (in main process)', () => {
  it('electron should be require("electron")', () => {
    assert(ConditionalRequire.electron === require('electron'));
  });

  it('os should be require("os")', () => {
    assert(ConditionalRequire.os === require('os'));
  });

  it('path should be require("path")', () => {
    assert(ConditionalRequire.path === require('path'));
  });
});
