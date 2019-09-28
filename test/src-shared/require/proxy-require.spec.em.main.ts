import assert = require('assert');
import { ProxyRequire } from '../../../src-shared/require/proxy-require';

describe('ProxyRequire (in main process)', () => {
  it('electron should be require("electron")', () => {
    assert(ProxyRequire.electron === require('electron'));
  });

  it('os should be require("os")', () => {
    assert(ProxyRequire.os === require('os'));
  });

  it('path should be require("path")', () => {
    assert(ProxyRequire.path === require('path'));
  });
});
