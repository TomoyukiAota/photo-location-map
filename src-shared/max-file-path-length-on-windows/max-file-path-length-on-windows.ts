import * as os from 'os';

// 259 comes from MAX_PATH (i.e. 260) minus the terminating null character.
// See https://stackoverflow.com/a/1880453/7947548
export const maxFilePathLengthOnWindows = 259;

export function isFilePathTooLongOnWindows(filePath: string): boolean {
  const isWindows = os.platform() === 'win32';
  return isWindows && filePath.length > maxFilePathLengthOnWindows;
}
