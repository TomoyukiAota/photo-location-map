import { RequireFromMainProcess } from '../require/require-from-main-process';

const versionStr = RequireFromMainProcess.electron.app.getVersion();

const includesAlphaInVersionStr = versionStr.toLowerCase().includes('alpha');
export function isAlphaVersion(): boolean { return includesAlphaInVersionStr; }

const includesBetaInVersionStr = versionStr.toLowerCase().includes('beta');
export function isBetaVersion(): boolean { return includesBetaInVersionStr; }

const includesRcInVersionStr = versionStr.toLowerCase().includes('rc');
export function isRcVersion(): boolean { return includesRcInVersionStr; }

export function isPrereleaseVersion(): boolean {
  return isAlphaVersion() || isBetaVersion() || isRcVersion();
}
