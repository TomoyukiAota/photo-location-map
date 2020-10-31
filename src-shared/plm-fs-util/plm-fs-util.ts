import * as fs from 'fs';
import * as fsUtils from 'nodejs-fs-utils';
import * as prettySize from 'prettysize';

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

export function getSizeInStringFormat(path: string): { size: string, errors: any[] } {
  const result = getSizeInNumber(path);
  const sizeInStringBytes = prettySize(result.size, {places: 2});
  return { size: sizeInStringBytes, errors: result.errors };
}
