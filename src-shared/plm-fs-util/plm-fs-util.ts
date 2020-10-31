import * as bytes from 'bytes';
import * as fs from 'fs';
import * as fsUtils from 'nodejs-fs-utils';

export async function fileExists(filePath: string): Promise<boolean> {
  return fs.promises.access(filePath, fs.constants.F_OK)
    .then(() => true)
    .catch(() => false);
}

export function getSizeInNumber(path: string): { size: number, errors: any[] } {
  const config: any = {
    skipErrors : true,
    symbolicLinks : false
  };
  const size: number = fsUtils.fsizeSync(path, config);
  const errors: any[] = config.errors;
  return { size, errors };
}

export function getSizeInStringBytes(path: string): { size: string, errors: any[] } {
  const result = getSizeInNumber(path);
  const sizeInStringBytes = bytes(result.size, { unitSeparator: ' ' });
  return { size: sizeInStringBytes, errors: result.errors };
}
