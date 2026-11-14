import * as fs from 'fs';
import * as path from 'path';

// The Electron-Mocha tests run compiled in out/em (test/em.tsconfig.json), so they find the repository's files, such as
// test/test-resources, from the repository's folder rather than from their own: the first above them with a
// package.json, which out/ does not have.
function repositoryOf(folder: string): string {
  for (let current = folder; ; current = path.dirname(current)) {
    if (fs.existsSync(path.join(current, 'package.json')))
      return current;
    if (path.dirname(current) === current)
      throw new Error(`No folder above ${folder} has a package.json.`);
  }
}

/** The repository's folder. */
export const repositoryRoot = repositoryOf(import.meta.dirname);

/** A path in the repository, from its folder: `repositoryPath('test', 'test-resources')`. */
export function repositoryPath(...segments: string[]): string {
  return path.join(repositoryRoot, ...segments);
}
