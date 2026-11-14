// Electron's fuses are switches in its binary, which electron-builder sets from electronFuses in electron-builder.json
// just before it signs a package. The package test reads them from the packaged binary, to check that they are as
// electron-builder.json says, and that every fuse of this Electron has been decided. See
// docs/contributing/electron-fuses.md.
//  - The fuses follow a sentinel in the binary: a byte of the wire's version, 1; a byte of the number of fuses; and a
//    byte for each fuse: '1' on, '0' off, 'r' removed. A universal macOS binary has a wire in each of its halves.
//  - The names are those of electronFuses, in Electron's order. electron-builder 26 cannot set the ninth,
//    wasmTrapHandlers, which keeps Electron's default.

const sentinel = Buffer.from('dL7pKGdnNz796PbbjQWNKmHXBZaB9tsX', 'ascii');
const fuseNames = ['runAsNode', 'enableCookieEncryption', 'enableNodeOptionsEnvironmentVariable',
  'enableNodeCliInspectArguments', 'enableEmbeddedAsarIntegrityValidation', 'onlyLoadAppFromAsar',
  'loadBrowserProcessSpecificV8Snapshot', 'grantFileProtocolExtraPrivileges', 'wasmTrapHandlers'];
// The fuses that electronFuses cannot set, with the state that Electron gives them.
const unsettableFuses = { wasmTrapHandlers: true };
const states = new Map([[0x31, true], [0x30, false], [0x72, 'removed']]);
const guide = 'see docs/contributing/electron-fuses.md';

const describe = state => state === true ? 'on' : state === false ? 'off' : String(state);

// The fuse wires of `binary`, one for each half of a universal binary, as the state of each fuse in Electron's order.
function fuseWiresOf(binary) {
  const wires = [];
  for (let at = binary.indexOf(sentinel); at !== -1; at = binary.indexOf(sentinel, at + sentinel.length)) {
    const start = at + sentinel.length;
    if (binary[start] !== 1) throw new Error(`The fuse wire has version ${binary[start]}, which this check does not know; ${guide}.`);
    const bytes = [...binary.subarray(start + 2, start + 2 + binary[start + 1])];
    wires.push(bytes.map(byte => {
      if (!states.has(byte)) throw new Error(`A fuse has the state ${byte}, which this check does not know; ${guide}.`);
      return states.get(byte);
    }));
  }
  if (wires.length === 0) throw new Error('No fuse wire was found in the binary.');
  return wires;
}

// Throws unless electronFuses of electron-builder.json, `configured`, sets every fuse that electron-builder can, and
// each of `wires` has every fuse as electron-builder.json says, or as Electron has it for those that it cannot set.
function checkElectronFuses({ configured, wires }) {
  const settable = fuseNames.filter(name => !(name in unsettableFuses));
  const notSet = settable.filter(name => typeof configured?.[name] !== 'boolean');
  if (notSet.length > 0) {
    throw new Error(`electronFuses in electron-builder.json sets every fuse on or off, but not ${notSet.join(', ')}; ${guide}.`);
  }
  const unknown = Object.keys(configured).filter(name => !settable.includes(name));
  if (unknown.length > 0) {
    throw new Error(`electronFuses in electron-builder.json has ${unknown.join(', ')}, which this check does not know; ${guide}.`);
  }
  const expected = { ...configured, ...unsettableFuses };
  wires.forEach((wire, index) => {
    const where = wires.length > 1 ? ` in half ${index + 1} of ${wires.length} of the binary` : '';
    if (wire.length > fuseNames.length) {
      throw new Error(`Electron has ${wire.length} fuses${where}, and this check knows ${fuseNames.length}: decide the new ones; ${guide}.`);
    }
    const differences = fuseNames.slice(0, wire.length)
      .map((name, fuse) => wire[fuse] === expected[name] ? undefined : `${name} is ${describe(wire[fuse])}, not ${describe(expected[name])}`)
      .filter(Boolean);
    if (differences.length > 0) {
      throw new Error(`The fuses of the packaged Electron${where} differ from electron-builder.json: ${differences.join('; ')}; ${guide}.`);
    }
  });
}

module.exports = { checkElectronFuses, fuseNames, fuseWiresOf };
