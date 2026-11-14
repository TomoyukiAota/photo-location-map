import fs from 'node:fs';
import path from 'node:path';

// TL;DR: After `ng build`, have dist/index.html fetch the app's chunk at once, with a modulepreload link, rather than
// after src/main.ts has run and found the page's bridge.
// Details: src/main.ts imports the app (src/start-app.ts) once the preload has given the page its bridge
// (src-shared/bridge/plm-bridge.ts, whenBridgeReady), so the build puts the app in a chunk that the entry imports.
// Angular preloads only the entry's static imports, so that chunk was fetched and compiled after the entry ran: in
// series rer-2-C1, the time from the page's navigation to the app's bootstrap grew by 17 ms against stage 0. With
// this link, six startups of the checkout took 120 ms to the bootstrap instead of 140, and 366 ms to the home view
// instead of 389. The build fails if the entry does not import exactly one chunk, so that a change of the build is
// seen rather than losing the preload.

export function preloadAppChunk(dist) {
  const entry = fs.readFileSync(path.join(dist, 'main.js'), 'utf8');
  const chunks = [...new Set([...entry.matchAll(/\bimport\(\s*[`'"]\.\/(chunk-[\w-]+\.js)[`'"]\s*\)/g)].map(match => match[1]))];
  if (chunks.length !== 1)
    throw new Error(`dist/main.js should import exactly one chunk, the app's, but imports ${chunks.length}: ${chunks.join(', ')}`);

  const indexPath = path.join(dist, 'index.html');
  const index = fs.readFileSync(indexPath, 'utf8');
  const script = '<script src="main.js" type="module"></script>';
  if (!index.includes(script))
    throw new Error(`dist/index.html has no ${script}`);
  const link = `<link rel="modulepreload" href="${chunks[0]}">`;
  if (!index.includes(link))
    fs.writeFileSync(indexPath, index.replace(script, `${link}${script}`));
  return chunks[0];
}

// Run by postbuild; test/script/ imports it.
if (import.meta.main) {
  const chunk = preloadAppChunk(path.join(import.meta.dirname, '..', '..', 'dist'));
  console.info(`dist/index.html preloads the app's chunk, ${chunk}.`);
}
