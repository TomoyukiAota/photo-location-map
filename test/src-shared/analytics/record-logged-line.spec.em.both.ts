import assert = require('assert');
import { loggedLineLabel, loggedLineValue } from '../../../src-shared/analytics/record-logged-line';
import { logged, shown } from '../../../src-shared/log/logged-line';

const mac = {
  appPaths: ['/Applications/Photo Location Map.app/Contents/Resources/app.asar'],
  sensitiveStrings: ['/Users/hanako', 'hanako'],
};
const windows = {
  appPaths: [] as string[],
  sensitiveStrings: ['C:\\Users\\Taro Yamada', 'Taro Yamada'],
};

describe('loggedLineLabel', () => {
  it('should send none of a path, a file name with spaces or the user name of a tagged line', () => {
    const folder = 'D:\\Photos\\Summer Trip to Kyoto';
    const label = loggedLineLabel(logged`Opening ${'IMG 0001.jpg'} in ${folder} for ${'Taro Yamada'} failed on ${shown('win32')}`, windows);

    assert.equal(label, 'Opening <value> in <value> for <value> failed on win32');
  });

  it('should scrub an error among the values of paths', () => {
    const error = new Error("ENOENT: no such file or directory, open 'C:\\Users\\Taro Yamada\\Pictures\\a b.jpg'");
    const label = loggedLineLabel(logged`Failed to read the log file. error: ${error}`, windows);

    assert.equal(label, "Failed to read the log file. error: Error: ENOENT: no such file or directory, open '<path>'");
  });

  it('should hide every quoted text of a plain line, and scrub it of paths and names', () => {
    const label = loggedLineLabel(`Tried to remove "IMG 0001" in /Users/hanako/Library/x as hanako`, mac);

    assert.equal(label, 'Tried to remove "<value>" in <path>');
  });

  it('should keep a plain line without values as it is', () => {
    assert.equal(loggedLineLabel('The worker that reads the trees of folders failed.', mac), 'The worker that reads the trees of folders failed.');
  });

  it('should describe an error given as the line', () => {
    assert.equal(loggedLineLabel(new TypeError("Cannot open '/Users/hanako/a.jpg'"), mac), "TypeError: Cannot open '<path>'");
  });
});

describe('loggedLineValue', () => {
  it('should give the first error among the arguments, with its stack, scrubbed', () => {
    const error = new Error("open '/Users/hanako/a.jpg'");
    error.stack = "Error: open '/Users/hanako/a.jpg'\n    at f (/Users/hanako/x.js:1:2)";

    assert.equal(loggedLineValue([{ path: '/Users/hanako' }, error, new Error('second')], mac), "Error: open '<path>'\nat f (<path>:1:2)");
  });

  it('should give nothing without an error', () => {
    assert.equal(loggedLineValue(['/Users/hanako/a.jpg', 3], mac), '');
  });
});
