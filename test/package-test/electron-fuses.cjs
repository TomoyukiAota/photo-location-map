const assert = require('node:assert/strict');
const test = require('node:test');
const builderConfig = require('../../electron-builder.json');
const { checkElectronFuses, fuseNames, fuseWiresOf } = require('../../script/package-test/electron-fuses');

const sentinel = 'dL7pKGdnNz796PbbjQWNKmHXBZaB9tsX';
const configured = builderConfig.electronFuses;

// A binary with a fuse wire for each of `wires`, each a string of '1', '0' and 'r', amid other bytes.
const binaryWith = (...wires) => Buffer.concat([Buffer.from('code before'), ...wires.flatMap(wire => [
  Buffer.from(sentinel), Buffer.from([1, wire.length]), Buffer.from(wire), Buffer.from('code after')])]);

// The wire of electron-builder.json's electronFuses, with wasmTrapHandlers on, as Electron has it.
const configuredWire = fuseNames.map(name => (name === 'wasmTrapHandlers' || configured[name]) ? '1' : '0').join('');

// `wire` with the fuse `name` set to `state`.
const withFuse = (wire, name, state) => {
  const index = fuseNames.indexOf(name);
  return wire.slice(0, index) + state + wire.slice(index + 1);
};

test('a binary gives its fuse wire, and a universal one a wire for each of its halves', () => {
  assert.deepEqual(fuseWiresOf(binaryWith('10r')), [[true, false, 'removed']]);
  assert.deepEqual(fuseWiresOf(binaryWith('10', '01')), [[true, false], [false, true]]);
});

test('a binary without a fuse wire, or with one that this check does not know, fails', () => {
  assert.throws(() => fuseWiresOf(Buffer.from('code without fuses')), /No fuse wire was found/);
  assert.throws(() => fuseWiresOf(Buffer.concat([Buffer.from(sentinel), Buffer.from([2, 1]), Buffer.from('1')])),
    /version 2, which this check does not know/);
  assert.throws(() => fuseWiresOf(binaryWith('1x')), /state 120, which this check does not know/);
});

test('the fuses that electron-builder.json sets pass, in each half of a universal binary', () => {
  checkElectronFuses({ configured, wires: fuseWiresOf(binaryWith(configuredWire, configuredWire)) });
});

test('electron-builder.json keeps on the fuses that the application needs, and changes the three of the plan', () => {
  // docs/contributing/electron-fuses.md has why each is so.
  assert.deepEqual(configured, {
    runAsNode: true,
    enableCookieEncryption: false,
    enableNodeOptionsEnvironmentVariable: false,
    enableNodeCliInspectArguments: true,
    enableEmbeddedAsarIntegrityValidation: true,
    onlyLoadAppFromAsar: true,
    loadBrowserProcessSpecificV8Snapshot: false,
    grantFileProtocolExtraPrivileges: true,
  });
});

test('electronFuses must decide every fuse that electron-builder can set, and only those', () => {
  const { runAsNode, ...withoutRunAsNode } = configured;
  assert.equal(typeof runAsNode, 'boolean');
  assert.throws(() => checkElectronFuses({ configured: withoutRunAsNode, wires: [] }), /sets every fuse on or off, but not runAsNode/);
  assert.throws(() => checkElectronFuses({ configured: { ...configured, wasmTrapHandlers: true }, wires: [] }),
    /has wasmTrapHandlers, which this check does not know/);
  assert.throws(() => checkElectronFuses({ configured: undefined, wires: [] }), /but not runAsNode, enableCookieEncryption/);
});

test('a fuse that differs from electron-builder.json fails, with its name and the half of the binary that has it', () => {
  const integrityOff = withFuse(configuredWire, 'enableEmbeddedAsarIntegrityValidation', '0');
  assert.throws(() => checkElectronFuses({ configured, wires: fuseWiresOf(binaryWith(configuredWire, integrityOff)) }),
    /in half 2 of 2 of the binary differ from electron-builder\.json: enableEmbeddedAsarIntegrityValidation is off, not on/);
  const nodeOptionsOn = withFuse(configuredWire, 'enableNodeOptionsEnvironmentVariable', '1');
  assert.throws(() => checkElectronFuses({ configured, wires: fuseWiresOf(binaryWith(nodeOptionsOn)) }),
    /Electron differ from electron-builder\.json: enableNodeOptionsEnvironmentVariable is on, not off/);
});

test('wasmTrapHandlers, which electron-builder cannot set, must stay on', () => {
  const wasmOff = withFuse(configuredWire, 'wasmTrapHandlers', '0');
  assert.throws(() => checkElectronFuses({ configured, wires: fuseWiresOf(binaryWith(wasmOff)) }), /wasmTrapHandlers is off, not on/);
});

test('a fuse that Electron removed, or one that it added, fails until it is decided', () => {
  const removed = withFuse(configuredWire, 'runAsNode', 'r');
  assert.throws(() => checkElectronFuses({ configured, wires: fuseWiresOf(binaryWith(removed)) }), /runAsNode is removed, not on/);
  assert.throws(() => checkElectronFuses({ configured, wires: fuseWiresOf(binaryWith(`${configuredWire}1`)) }),
    /Electron has 10 fuses, and this check knows 9: decide the new ones/);
});

test('an Electron with fewer fuses is checked for those that it has', () => {
  checkElectronFuses({ configured, wires: fuseWiresOf(binaryWith(configuredWire.slice(0, 8))) });
});
