import type { UpdateInfo } from 'electron-updater';

// The oldest OS version that a release runs on, as latest-mac.yml or latest.yml gives it. electron-builder copies
// mac.releaseInfo and win.releaseInfo of electron-builder.json into them, so releaseInfo.vendor.minimumSystemVersion
// arrives here as vendor.minimumSystemVersion. Releases published before it was added have none.
export function minimumSystemVersionOf(updateInfo: UpdateInfo): string | undefined {
  const vendor = (updateInfo as UpdateInfo & { vendor?: { minimumSystemVersion?: unknown } | null }).vendor;
  const version = vendor?.minimumSystemVersion;
  return typeof version === 'string' ? version : undefined;
}

export interface SystemVersion {
  name: 'macOS' | 'Windows';
  version: string;
}

// The OS version of this computer that the minimum is compared with: "12.7.6" on macOS (os.release() would give the
// Darwin version instead), and "10.0.19045" on Windows, where Windows 11 is 10.0.22000 or later. Undefined elsewhere.
export function currentSystemVersion(platform: NodeJS.Platform = process.platform,
                                     getSystemVersion = () => process.getSystemVersion()): SystemVersion | undefined {
  switch (platform) {
    case 'darwin': return { name: 'macOS', version: getSystemVersion() };
    case 'win32': return { name: 'Windows', version: getSystemVersion() };
    default: return undefined;
  }
}

// Whether a version such as "12.7.6" is at least one such as "13.0". The parts are compared as numbers, and a missing
// part counts as 0. Undefined when either is not made of numbers separated by dots.
export function isVersionAtLeast(version: string, minimum: string): boolean | undefined {
  const parse = (text: string) => /^\d+(\.\d+)*$/.test(text) ? text.split('.').map(Number) : undefined;
  const actual = parse(version);
  const required = parse(minimum);
  if (!actual || !required)
    return undefined;

  for (let index = 0; index < Math.max(actual.length, required.length); index++) {
    const difference = (actual[index] ?? 0) - (required[index] ?? 0);
    if (difference !== 0)
      return difference > 0;
  }
  return true;
}
