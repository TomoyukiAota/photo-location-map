// The oldest OS version that the app runs on is declared in electron-builder.json, and auto-update compares it with the
// computer's before downloading an update (src-main/auto-update/configure-auto-update.ts). See
// docs/contributing/minimum-os-versions.md.
//  - macOS: mac.minimumSystemVersion becomes LSMinimumSystemVersion in Info.plist, which macOS checks when the app is
//    opened, and mac.releaseInfo.vendor.minimumSystemVersion goes into latest-mac.yml. Both have to be the same, and
//    neither may be older than the macOS that Electron is built for, which an Electron upgrade can raise.
//  - Windows: win.releaseInfo.vendor.minimumSystemVersion goes into latest.yml. Windows binaries do not say which Windows
//    Electron needs, so only the declaration itself is checked.

const versionPattern = /^\d+(\.\d+)*$/;

// Compares versions such as "12.7" and "13.0" part by part as numbers; a missing part counts as 0.
export function compareVersions(left, right) {
  const leftParts = left.split('.').map(Number);
  const rightParts = right.split('.').map(Number);
  for (let index = 0; index < Math.max(leftParts.length, rightParts.length); index++) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

// The minimum macOS of each architecture in the output of `otool -arch all -l`, from its LC_BUILD_VERSION load command.
export function buildMinimumsOf(otoolOutput) {
  return [...otoolOutput.matchAll(/cmd LC_BUILD_VERSION[\s\S]*?\bminos (\S+)/g)].map(match => match[1]);
}

// vendor.minimumSystemVersion of latest-mac.yml or latest.yml, as electron-builder writes it.
export function feedMinimumOf(feedYml) {
  return /^vendor:\r?\n[ \t]+minimumSystemVersion: *['"]?([^'"\s]+)['"]? *\r?$/m.exec(feedYml)?.[1];
}

function checkDeclaredVersion(name, configured) {
  if (typeof configured !== 'string' || !versionPattern.test(configured)) {
    throw new Error(`${name} in electron-builder.json must be a version such as 13.0, not ${configured}.`);
  }
}

function checkSameEverywhere(name, configured, others) {
  const mismatches = others.filter(([, value]) => value !== configured);
  if (mismatches.length > 0) {
    const found = mismatches.map(([otherName, value]) => `${otherName} is ${value}`).join('; ');
    throw new Error(`Every declared minimum must be ${name} (${configured}), but ${found}.`);
  }
}

// Throws unless the declared minimum macOS is the same everywhere and at least what Electron is built for. Returns the latter.
export function checkMacMinimumSystemVersion({ configured, vendor, plist, feed, electron }) {
  checkDeclaredVersion('mac.minimumSystemVersion', configured);
  checkSameEverywhere('mac.minimumSystemVersion', configured, [
    ['mac.releaseInfo.vendor.minimumSystemVersion in electron-builder.json', vendor],
    ['LSMinimumSystemVersion in the packaged Info.plist', plist],
    ['vendor.minimumSystemVersion in latest-mac.yml', feed],
  ]);
  if (electron.length === 0 || !electron.every(version => versionPattern.test(version))) {
    throw new Error(`Could not read the minimum macOS that Electron is built for: ${JSON.stringify(electron)}.`);
  }
  const electronMinimum = electron.reduce((highest, version) => compareVersions(version, highest) > 0 ? version : highest);
  if (compareVersions(configured, electronMinimum) < 0) {
    throw new Error(`Electron is built for macOS ${electronMinimum} or later, but electron-builder.json declares ${configured}. `
      + `Raise mac.minimumSystemVersion and mac.releaseInfo.vendor.minimumSystemVersion to at least ${electronMinimum}; `
      + 'see docs/contributing/minimum-os-versions.md.');
  }
  return electronMinimum;
}

// Throws unless latest.yml carries the declared minimum Windows.
export function checkWindowsMinimumSystemVersion({ configured, feed }) {
  checkDeclaredVersion('win.releaseInfo.vendor.minimumSystemVersion', configured);
  checkSameEverywhere('win.releaseInfo.vendor.minimumSystemVersion', configured, [
    ['vendor.minimumSystemVersion in latest.yml', feed],
  ]);
}
