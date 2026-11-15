import assert from 'node:assert/strict';
import test from 'node:test';
import builderConfig from '../../electron-builder.json' with { type: 'json' };

// TL;DR: electron-builder.json names the DMG and the zip for macOS without the spaces of "Photo Location Map", so
// that the blockmap of the zip is published under the name that electron-updater asks for.
// Details: electron-builder 26.18.1 publishes each package to GitHub under its name with dashes for the spaces, but
// the blockmap of the macOS zip under the zip's own name: ArchiveTarget of app-builder-lib passes that name, not the
// one with dashes, to createBlockmap. GitHub turns the spaces into dots, and the draft of 1.13.0-rc.1 got
// "Photo.Location.Map-1.13.0-rc.1-universal-mac.zip.blockmap". For a differential update, electron-updater asks for
// the zip's name with ".blockmap", finds nothing, and downloads the whole zip, about 230 MB, in place of the blocks
// that changed. The blockmaps of the DMG and of the Windows installer get the name with dashes. A name without a
// space is published as it is, so each file goes to GitHub under its name in release/.
// The names are electron-builder's defaults with dashes for the spaces: the releases so far are published under
// them, docs/github-pages/download.js links the DMG by its name, and electron-updater finds the blockmap of the
// installed release by putting its version in the name of the new zip.
// They can go back to the defaults once electron-builder gives the zip's blockmap the name with dashes.

// The name that `pattern` gives the package of `ext` for 1.13.0, with the macros as electron-builder fills them for
// the universal application on macOS.
const nameOf = (pattern, ext) => pattern.replaceAll('${version}', '1.13.0').replaceAll('${arch}', 'universal')
  .replaceAll('${os}', 'mac').replaceAll('${ext}', ext);

test('electron-builder.json names the macOS packages without a space, as they are published', () => {
  assert.equal(nameOf(builderConfig.dmg.artifactName, 'dmg'), 'Photo-Location-Map-1.13.0-universal.dmg');
  assert.equal(nameOf(builderConfig.mac.artifactName, 'zip'), 'Photo-Location-Map-1.13.0-universal-mac.zip');
});
