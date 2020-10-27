import { RequireFromMainProcess } from '../require/require-from-main-process';

const versionStr = RequireFromMainProcess.electron.app.getVersion();
const includesAlphaInVersionStr = versionStr.toLowerCase().includes('alpha');

export function isAlphaVersion(): boolean {
  return includesAlphaInVersionStr;
}
