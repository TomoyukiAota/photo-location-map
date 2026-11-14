import { currentPlatform } from '../startup/startup-metadata.js';

// 259 comes from MAX_PATH (i.e. 260) minus the terminating null character.
// See https://stackoverflow.com/a/1880453/7947548
export const maxFilePathLengthOnWindows = 259;

/** Whether this runs on Windows and `filePath` is longer than its maximum, `maxFilePathLengthOnWindows`. */
export function isFilePathTooLongOnWindows(filePath: string): boolean {
  const isWindows = currentPlatform() === 'win32';
  return isWindows && filePath.length > maxFilePathLengthOnWindows;
}
