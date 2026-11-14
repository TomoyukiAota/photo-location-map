import assert from 'assert';
import { syncBuiltinESMExports } from 'module';
import os from 'os';
import { userNameOrEmpty } from '../../../src-main/os/user-name.js';

describe('userNameOrEmpty (in main process)', () => {
  it('is the user\'s name, or empty where os.userInfo() throws, as for a user without a name', () => {
    assert.strictEqual(userNameOrEmpty(), os.userInfo().username);
    // The CommonJS module's object: src-main/os/user-name.ts reads the function from os's ES module, whose exports
    // follow it once syncBuiltinESMExports() is called.
    const module = os as unknown as { userInfo: () => unknown };
    const userInfo = module.userInfo;
    module.userInfo = () => { throw new Error('ENOENT: no such file or directory, uv_os_get_passwd'); };
    syncBuiltinESMExports();
    try {
      assert.strictEqual(userNameOrEmpty(), '');
    } finally {
      module.userInfo = userInfo;
      syncBuiltinESMExports();
    }
  });
});
