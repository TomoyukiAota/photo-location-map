import assert = require('assert');
import { RequireFromMainProcess } from '../../../src-shared/require/require-from-main-process';

describe('RequireFromMainProcess (in real Electron renderer)', () => {
  for (const [property, moduleName] of [['fsExtra', 'fs-extra'], ['os', 'os']] as const) {
    it(`${property} should not be null`, () => {
      assert.notEqual(RequireFromMainProcess[property], null);
    });

    it(`${property} should be the real remote module`, () => {
      assert.equal(RequireFromMainProcess[property], window.require('@electron/remote').require(moduleName));
    });
  }
});
