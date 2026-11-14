import assert from 'assert';
import {
  errorForAnalytics, maxAggregatedErrors, maxCauses, maxStackFrames, scrubConsoleMessage, scrubConsoleSource, scrubMessage, scrubStack,
} from '../../../src-shared/analytics/error-for-analytics.js';

const mac = {
  appPaths: ['/Applications/Photo Location Map.app/Contents/Resources/app.asar'],
  sensitiveStrings: ['/Users/hanako', 'hanako'],
};
// The tests compile against ES2020, which has neither the cause of an error nor AggregateError in its types.
const withCause = <T extends Error>(error: T, cause: unknown): T => Object.assign(error, { cause });
const AggregateErrorClass = (globalThis as unknown as { AggregateError: new (errors: unknown[], message: string) => Error }).AggregateError;

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

  it('should remove an unquoted path in the home folder to the end of its line, as its names can have spaces', () => {
    assert.equal(scrubMessage('Failed in /Users/hanako/Pictures/Trip to Kyoto\nthen stopped', mac), 'Failed in <path>\nthen stopped');
    assert.equal(scrubMessage('Cannot open C:\\Users\\Taro Yamada\\Pictures\\Summer Trip\\a b.jpg now', windows), 'Cannot open <path>');
  });

  it('should replace the user name anywhere', () => {
    assert.equal(scrubMessage('Permission denied for hanako', mac), 'Permission denied for <user>');
  });

  it('should remove the name of a photo or a movie, quoted with spaces or by itself', () => {
    const message = "Cannot decode 'IMG 0001.HEIC', then IMG_0002.jpg and clip.MOV: not a picture";
    const scrubbed = scrubMessage(message, mac);

    assert.equal(scrubbed, "Cannot decode '<file>', then <file> and <file>: not a picture");
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
      'at f (native)',
      'at g (native)',
    ]);
  });

  it('should keep the first 20 frames', () => {
    const frames = Array.from({ length: 25 }, (_, i) => `    at f${i} (/Applications/Photo Location Map.app/Contents/Resources/app.asar/dist/main.js:${i}:1)`);
    const scrubbed = scrubStack(['Error: x', ...frames].join('\n'), mac).split('\n');

    assert.equal(maxStackFrames, 20);
    assert.equal(scrubbed.length, 20);
    assert.equal(scrubbed[19], 'at f19 (app.asar/dist/main.js:19:1)');
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
    assert.deepEqual(errorForAnalytics(undefined, mac), { label: 'undefined: undefined', value: '' });
  });

  it('should follow the causes, each scrubbed, up to three deep', () => {
    const root = new Error("EACCES: permission denied, open 'C:\\Users\\Taro Yamada\\Pictures\\a.jpg'");
    root.stack = 'Error: EACCES\n    at open (node:internal/fs/promises:100:7)';
    const middle = withCause(new Error('Reading the photo failed'), root);
    middle.stack = 'Error: Reading the photo failed\n    at read (C:\\Users\\Taro Yamada\\x.js:1:2)';
    const top = withCause(new TypeError('Opening the folder failed'), middle);
    top.stack = 'TypeError: Opening the folder failed\n    at open (C:\\Users\\Taro Yamada\\AppData\\Local\\Programs\\photo-location-map\\resources\\app.asar\\dist\\main.js:3:4)';

    const result = errorForAnalytics(top, windows);

    assert.equal(result.label, 'TypeError: Opening the folder failed');
    assert.deepEqual(result.value.split('\n'), [
      'at open (app.asar/dist/main.js:3:4)',
      'Caused by: Error: Reading the photo failed',
      'at read (<path>:1:2)',
      "Caused by: Error: EACCES: permission denied, open '<path>'",
      'at open (node:internal/fs/promises:100:7)',
    ]);
    assert.ok(!result.value.includes('Taro'));
  });

  it('should stop at three causes, also when the causes go round', () => {
    const error = new Error('loop');
    withCause(error, error);
    error.stack = 'Error: loop';

    const causes = errorForAnalytics(error, mac).value.split('\n').filter(line => line.startsWith('Caused by:'));

    assert.equal(causes.length, maxCauses);
  });

  it("should give an AggregateError's first errors, and how many it holds", () => {
    const errors = ['one', 'two', 'three', 'four'].map(message => Object.assign(new Error(message), { stack: `Error: ${message}` }));
    const aggregate = new AggregateErrorClass(errors, 'All failed');
    aggregate.stack = 'AggregateError: All failed';

    const lines = errorForAnalytics(aggregate, mac).value.split('\n');

    assert.equal(maxAggregatedErrors, 3);
    assert.deepEqual(lines, ['Error 1 of 4: Error: one', 'Error 2 of 4: Error: two', 'Error 3 of 4: Error: three']);
  });

  it('should describe an object with a message as an error, and an ErrorEvent by its name', () => {
    const fromWorker = { name: 'RangeError', message: "Bad size of '/Users/hanako/a.png'", stack: 'RangeError: x\n    at f (/Users/hanako/w.js:1:2)' };
    assert.deepEqual(errorForAnalytics(fromWorker, mac), { label: "RangeError: Bad size of '<path>'", value: 'at f (<path>:1:2)' });

    class ErrorEvent { public readonly message = 'Script error.'; }
    assert.equal(errorForAnalytics(new ErrorEvent(), mac).label, 'ErrorEvent: Script error.');
  });

  it('should give an object as JSON with only the codes of its diagnostic fields, not [object Object]', () => {
    const thrown = {
      code: 'ENOENT', errno: -2, folder: 'Trip to Kyoto', file: 'IMG_0001.JPG', name: 'IMG_0001', ok: false, inner: { reason: 'killed' },
      accessToken: 'abcdef0123456789abcdef0123456789', status: '0123456789abcdef',
    };

    const { label } = errorForAnalytics(thrown, mac);

    assert.equal(label, 'Object: {"code":"ENOENT","errno":-2,"folder":"<value>","file":"<value>","name":"<value>","ok":false,'
      + '"inner":{"reason":"killed"},"accessToken":"<value>","status":"<value>"}');
    class Event { public readonly isTrusted = true; }
    assert.equal(errorForAnalytics(new Event(), mac).label, 'Event: {"isTrusted":true}');
  });

  it('should give an object that JSON cannot write by its type', () => {
    const cyclic: { self?: unknown } = {};
    cyclic.self = cyclic;

    assert.equal(errorForAnalytics(cyclic, mac).label, 'Object: [object Object]');
  });

  it('should send none of a path, a file name with spaces or the user name, from the error or its causes', () => {
    const cause = new Error("open 'IMG 0001.jpg' for hanako");
    cause.stack = "Error: open 'IMG 0001.jpg'\n    at g (/Users/hanako/Pictures/Trip to Kyoto/x.js:1:2)";
    const error = withCause(new Error('Failed in /Users/hanako/Pictures/Trip to Kyoto'), cause);
    error.stack = 'Error: Failed\n    at f (/Users/hanako/Pictures/Trip to Kyoto/y.js:3:4)';

    const { label, value } = errorForAnalytics(error, mac);

    for (const text of [label, value]) {
      for (const name of ['hanako', 'Pictures', 'Kyoto', 'IMG', '0001'])
        assert.ok(!text.includes(name), `${name} is in ${text}`);
    }
  });
});

describe('scrubConsoleMessage and scrubConsoleSource', () => {
  it('should keep a web address by its origin, without the user name that a computer on the network can be named with', () => {
    const message = 'GET http://hanako-macbook.local:8080/tiles/1/2/3.png?key=secret net::ERR_CONNECTION_REFUSED';

    assert.equal(scrubConsoleMessage(message, mac), 'GET http://<user>-macbook.local:8080/<path> net::ERR_CONNECTION_REFUSED');
    assert.equal(scrubConsoleSource('http://hanako-macbook.local:8080/tiles/1/2/3.png', mac), 'http://<user>-macbook.local:8080/<path>');
  });

  it('should take the user name out of an origin in any case, as a URL gives its host in lower case', () => {
    const capitalized = { ...mac, sensitiveStrings: ['/Users/Hanako', 'Hanako'] };

    assert.equal(scrubConsoleMessage('GET http://Hanako-MacBook.local:8080/x.png failed', capitalized), 'GET http://<user>-macbook.local:8080/<path> failed');
    assert.equal(scrubConsoleSource('http://Hanako-MacBook.local:8080/x.png', capitalized), 'http://<user>-macbook.local:8080/<path>');
  });

  it('should give any web source by its origin only, a local server\'s and one that names app.asar among them', () => {
    assert.equal(scrubConsoleSource('http://localhost:8080/tiles/12/3456/789.png?key=secret', mac), 'http://localhost:8080/<path>');
    assert.equal(scrubConsoleSource('https://example.org/x/app.asar/dist/main.js', mac), 'https://example.org/<path>');
  });

  it('should give a file of the app\'s by its name, without a query', () => {
    const source = 'file:///Applications/Photo%20Location%20Map.app/Contents/Resources/app.asar/dist/main.js?v=1#x';

    assert.equal(scrubConsoleSource(source, mac), 'app.asar/dist/main.js');
    assert.equal(scrubConsoleSource('file:///Users/hanako/Pictures/a.html?b', mac), '<path>');
  });
});
