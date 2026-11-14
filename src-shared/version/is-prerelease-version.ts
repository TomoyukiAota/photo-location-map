import { startupMetadata } from '../startup/startup-metadata.js';

// Read when asked rather than when this module is evaluated, so that it never runs before the metadata can be had.
const versionIncludes = (text: string): boolean => startupMetadata().version.toLowerCase().includes(text);

export function isAlphaVersion(): boolean { return versionIncludes('alpha'); }

export function isBetaVersion(): boolean { return versionIncludes('beta'); }

export function isRcVersion(): boolean { return versionIncludes('rc'); }

export function isPrereleaseVersion(): boolean {
  return isAlphaVersion() || isBetaVersion() || isRcVersion();
}
