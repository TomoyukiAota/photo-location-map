import fs from 'node:fs';
import path from 'node:path';

// TL;DR: Removes the output of an earlier build that a build or a test could take: what tsc wrote beside the sources,
// and the output folder that the caller names, which tsc then writes again.
// Details:
// - Until the main process was compiled into out/app, tsc wrote each .js and .js.map beside its .ts, in src-main/,
//   src-shared/, and src/ and test/ for the Electron-Mocha tests. The renderer's build bundles src-shared from its
//   TypeScript, and for an import of ./foo.js, esbuild takes a foo.js beside foo.ts rather than foo.ts, so such a file
//   would be bundled in place of the source (docs/contributing/module-formats.md). A .js is removed only beside a .ts of
//   the same name.
// - tsc leaves in its output folder the output of a source that was removed or renamed, which a package would ship.

const root = path.resolve(import.meta.dirname, '..', '..');
const sourceFolders = ['src', 'src-main', 'src-shared', 'test'];

/** Removes the .js and .js.map files beside a .ts of the same name in `folder` and its subfolders. */
function removeOutputBesideSources(folder) {
  let removed = 0;
  for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    const entryPath = path.join(folder, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules') removed += removeOutputBesideSources(entryPath);
    } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
      for (const output of [entryPath.replace(/\.ts$/, '.js'), entryPath.replace(/\.ts$/, '.js.map')]) {
        if (fs.existsSync(output)) {
          fs.rmSync(output);
          removed++;
        }
      }
    }
  }
  return removed;
}

/**
 * Removes the output of tsc beside the sources and, when given, the output folder `outputFolder` (relative to the
 * repository). Returns how many files beside the sources it removed.
 */
export function removeStaleOutput(outputFolder) {
  if (outputFolder) {
    const target = path.resolve(root, outputFolder);
    if (path.relative(path.join(root, 'out'), target).startsWith('..')) throw new Error(`Not a folder of out/: ${outputFolder}`);
    fs.rmSync(target, { recursive: true, force: true });
  }
  return sourceFolders.reduce((count, folder) => count + removeOutputBesideSources(path.join(root, folder)), 0);
}

// Run before a build or a test: `node script/build/remove-stale-output.js [out/<folder>]`.
if (import.meta.main) {
  const removed = removeStaleOutput(process.argv[2]);
  if (removed > 0) console.info(`Removed ${removed} files that tsc had written beside the sources.`);
}
