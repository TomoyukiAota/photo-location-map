import assert = require('assert');
import { ProxyRequire } from '../../../src-shared/require/proxy-require';

describe('ProxyRequire (in real Electron renderer)', () => {
  for (const name of ['electron', 'os', 'path'] as const) {
    it(`${name} should not be null`, () => {
      assert.notEqual(ProxyRequire[name], null);
    });

    it(`${name} should be window.require(${name})`, () => {
      assert.equal(ProxyRequire[name], window.require(name));
    });
  }
});
