import * as fs from 'fs';

export async function fileExists(filePath: string): Promise<boolean> {
  return fs.promises.access(filePath, fs.constants.F_OK)
    .then(() => true)
    .catch(() => false);
}
