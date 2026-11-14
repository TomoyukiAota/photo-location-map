import assert from 'assert';
import { createPrependedLogger } from '../../../src-shared/log/create-prepended-logger.js';
import { logged, shown } from '../../../src-shared/log/logged-line.js';
import { Logger, useLineRecorder } from '../../../src-shared/log/logger.js';

describe('logged', () => {
  const path = '/Users/hanako/Pictures/Trip to Kyoto/IMG 0001.jpg';

  it('should give the console and the log file the whole line', () => {
    const line = logged`Failed to open "${path}" after ${3} tries: ${new TypeError('bad')} on ${shown('darwin')}`;

    assert.equal(String(line), `Failed to open "${path}" after 3 tries: TypeError: bad on darwin`);
    assert.equal(`${line}`, String(line));
  });

  it('should record each value as <value>, but numbers, booleans, errors and shown values', () => {
    const line = logged`Failed to open "${path}" after ${3} tries (${true}): ${new TypeError('bad')} on ${shown('darwin')}, ${{ name: 'x' }}`;

    assert.equal(line.recorded, 'Failed to open "<value>" after 3 tries (true): TypeError: bad on darwin, <value>');
  });

  it('should keep a line without values as it is', () => {
    assert.equal(logged`Nothing to say.`.recorded, 'Nothing to say.');
    assert.equal(String(logged`Nothing to say.`), 'Nothing to say.');
  });

  it('should put a prefix before the line, in both its forms', () => {
    const line = logged`Failed for ${path}`.prefixed('[Thumbnail] ');

    assert.equal(String(line), `[Thumbnail] Failed for ${path}`);
    assert.equal(line.recorded, '[Thumbnail] Failed for <value>');
  });
});

describe('Logger and its line recorder', () => {
  const recorded: { level: string, message: unknown, args: readonly unknown[] }[] = [];
  before(() => useLineRecorder((level, message, args) => recorded.push({ level, message, args })));
  after(() => useLineRecorder(undefined));
  beforeEach(() => recorded.splice(0));

  it('should record the errors and warnings it logs, with their other arguments', () => {
    const error = new Error('x');
    Logger.error('An error', error);
    Logger.warn(logged`A warning about ${'a.jpg'}`);

    assert.deepEqual(recorded.map(line => [line.level, String(line.message)]), [['error', 'An error'], ['warn', 'A warning about a.jpg']]);
    assert.equal(recorded[0].args[0], error);
  });

  it('should not record what it logs as not recorded, nor info', () => {
    Logger.errorNotRecorded('Not this');
    Logger.warnNotRecorded('Nor this');
    Logger.info('Nor info');

    assert.deepEqual(recorded, []);
  });

  it('should record a prepended logger\'s lines with the prefix, unless it is made not to record', () => {
    createPrependedLogger('[Test]').warn(logged`About ${'b.jpg'}`);
    createPrependedLogger('[Analytics]', { recorded: false }).error('Not sent');
    createPrependedLogger('[Test]').errorNotRecorded('Nor this');

    assert.equal(recorded.length, 1);
    assert.equal(String(recorded[0].message), '[Test] About b.jpg');
  });
});
