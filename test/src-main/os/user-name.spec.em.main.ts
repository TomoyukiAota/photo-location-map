import assert = require('assert');
import os = require('os');
import { userNameOrEmpty } from '../../../src-main/os/user-name';

describe('userNameOrEmpty (in main process)', () => {
  it('is the user\'s name, or empty where os.userInfo() throws, as for a user without a name', () => {
    assert.strictEqual(userNameOrEmpty(), os.userInfo().username);
    // The module's own object, which src-main/os/user-name.ts reads its function from.
    const module = os as unknown as { userInfo: () => unknown };
    const userInfo = module.userInfo;
    module.userInfo = () => { throw new Error('ENOENT: no such file or directory, uv_os_get_passwd'); };
    try {
      assert.strictEqual(userNameOrEmpty(), '');
    } finally {
      module.userInfo = userInfo;
    }
  });
});
