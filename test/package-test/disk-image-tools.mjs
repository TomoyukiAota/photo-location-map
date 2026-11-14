import assert from 'node:assert/strict';
import test from 'node:test';
import getDiskImageTools from '../../script/package-test/disk-image-tools.js';

function select(probe) {
  return getDiskImageTools((command, args, options) => {
    assert.equal(command, '/usr/sbin/diskutil');
    assert.deepEqual(args, ['image', 'attach']);
    assert.equal(options.encoding, 'utf8');
    return probe;
  });
}

test('supported diskutil image attach uses eject for cleanup', () => {
  const tools = select({ status: 0, stdout: 'USAGE: diskutil image attach [options] <image-url>' });
  assert.equal(tools.attach, '/usr/sbin/diskutil image attach');
  assert.equal(tools.detach, '/usr/sbin/diskutil');
  assert.equal(tools.detachVerb, 'eject');
});

test('capability usage can be printed on stderr', () => {
  assert.equal(select({ status: 0, stderr: 'Usage: diskutil image attach <image-url>' }).detachVerb, 'eject');
});

test('older diskutil and unavailable tools retain hdiutil attachment and cleanup', () => {
  for (const probe of [
    { status: 1, stderr: 'diskutil: did not recognize verb image' },
    { status: null, error: Object.assign(new Error('unavailable'), { code: 'ENOENT' }) },
    { status: 0, stdout: 'Usage: diskutil image <subcommand>' },
  ]) {
    const tools = select(probe);
    assert.equal(tools.attach, '/usr/bin/hdiutil attach');
    assert.equal(tools.detach, '/usr/bin/hdiutil');
    assert.equal(tools.detachVerb, 'detach');
  }
});

test('a failed capability probe does not enable the replacement', () => {
  assert.equal(select({ status: 64, stderr: 'Usage: diskutil image attach <image-url>' }).detachVerb, 'detach');
});
