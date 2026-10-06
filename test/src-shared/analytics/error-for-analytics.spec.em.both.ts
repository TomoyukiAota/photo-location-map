// power-assert's parser in this test setup does not accept newer syntax such as `??` or `1_000`.
import assert = require('assert');
import { errorForAnalytics, scrubMessage, scrubStack } from '../../../src-shared/analytics/error-for-analytics';

const mac = {
  appPaths: ['/Applications/Photo Location Map.app/Contents/Resources/app.asar'],
  sensitiveStrings: ['/Users/hanako', 'hanako'],
};
const windows = {
  appPaths: ['C:\\Users\\Taro Yamada\\AppData\\Local\\Programs\\photo-location-map\\resources\\app.asar'],
  sensitiveStrings: ['C:\\Users\\Taro Yamada', 'Taro Yamada'],
};

describe('scrubMessage', () => {
  it('should remove a quoted path with spaces, keeping the words around it', () => {
    const message = "ENOENT: no such file or directory, open '/Users/hanako/Pictures/Trip to Kyoto/IMG 0001.jpg'";

    assert.equal(scrubMessage(message, mac), "ENOENT: no such file or directory, open '<path>'");
  });

  it('should remove unquoted Windows and POSIX paths and file URLs', () => {
    const message = 'Cannot read C:\\Users\\Taro Yamada\\Pictures\\a.jpg or /tmp/x/y.heic or file:///D:/Photos/b.png';
    const scrubbed = scrubMessage(message, windows);

    assert.ok(!scrubbed.includes('Taro'));
    assert.ok(!scrubbed.includes('Pictures'));
    assert.ok(!scrubbed.includes('Photos'));
    assert.ok(!scrubbed.includes('a.jpg'));
    assert.ok(scrubbed.startsWith('Cannot read '));
  });

  it('should replace the user name anywhere', () => {
    assert.equal(scrubMessage('Permission denied for hanako', mac), 'Permission denied for <user>');
  });

  it('should keep a message without paths as it is', () => {
    assert.equal(scrubMessage("Cannot read properties of undefined (reading 'lat')", mac),
      "Cannot read properties of undefined (reading 'lat')");
  });
});

describe('scrubStack', () => {
  it('should keep function names and files inside the app, and remove other locations', () => {
    const stack = [
      'TypeError: x is undefined',
      '    at LeafletMap.render (/Applications/Photo Location Map.app/Contents/Resources/app.asar/dist/main.js:10:20)',
      '    at file:///C:/Users/Taro%20Yamada/AppData/Local/Programs/photo-location-map/resources/app.asar/dist/main.js:3:4',
      '    at Object.<anonymous> (/Users/hanako/Library/plugin.js:1:2)',
      '    at node:internal/fs/promises:100:7',
      '    at http://localhost:4200/main.js:5:6',
      '    at f (native)',
      '    at g (native)',
    ].join('\n');

    const scrubbed = scrubStack(stack, mac).split('\n');

    assert.deepEqual(scrubbed, [
      'at LeafletMap.render (app.asar/dist/main.js:10:20)',
      'at app.asar/dist/main.js:3:4',
      'at Object.<anonymous> (<path>:1:2)',
      'at node:internal/fs/promises:100:7',
      'at main.js:5:6',
    ]);
  });

  it('should keep files under an app folder that is not a bundle, relative to it', () => {
    const context = { appPaths: ['/Users/dev/photo-location-map'], sensitiveStrings: [] as string[] };
    const scrubbed = scrubStack('Error\n    at f (/Users/dev/photo-location-map/src-main/x.js:1:2)', context);

    assert.equal(scrubbed, 'at f (src-main/x.js:1:2)');
  });
});

describe('errorForAnalytics', () => {
  it('should give the name and scrubbed message as the label, and the scrubbed stack as the value', () => {
    const error = new TypeError("Cannot open '/Users/hanako/a.jpg'");
    error.stack = "TypeError: Cannot open '/Users/hanako/a.jpg'\n    at f (/Users/hanako/x.js:1:2)";

    const result = errorForAnalytics(error, mac);

    assert.equal(result.label, "TypeError: Cannot open '<path>'");
    assert.equal(result.value, 'at f (<path>:1:2)');
  });

  it('should handle a value that is not an Error', () => {
    assert.deepEqual(errorForAnalytics('failed at /Users/hanako/x', mac), { label: 'string: failed at <path>', value: '' });
  });
});
