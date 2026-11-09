// Makes the folders that the performance scenarios open, from the public fixtures only, and a SHA-256 manifest of
// them. The same version of this file makes the same files, so a workload ID names its exact content.
//
//   node test/performance/workload.mjs <output directory>
//
// The folders are:
//   large/      300 JPEG (four with location data, one without, in turn), 10 Live Photos movies, 12 HEIC and two
//               broken files, in 10 folders and their nested folders, with Unicode, spaces, # and % in the names.
//   view-jpeg/  one JPEG with location data, under a name with Unicode, spaces, # and %.
//   view-heic/  one HEIC with location data and a rotation, likewise.
import { constants, createReadStream } from 'node:fs';
import { copyFile, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const photos = path.join(root, 'test/test-resources/actual-photos');
const jpegSources = [
  path.join(photos, 'Kobe/IMG_4676.JPG'),
  path.join(photos, 'Apple Park/IMG_5769.JPG'),
  path.join(photos, 'Gold Coast/IMG_1579.JPG'),
  path.join(photos, 'Unga/IMG_2581.JPG'),
  path.join(photos, 'Unga/IMG_2581_WithoutGpsInfo.JPG'),
];
const movieSource = path.join(photos, 'Kobe/IMG_4676.MOV');
const heicSource = path.join(root, 'test/e2e/fixtures/demo.heic');
const folderNames = ['01 写真', '02 # sharp', '03 100% done', '04 空白 あり', '05 Ünïcödé', '06 a#b%c', '07 旅行 2017',
  '08 plain', '09 % only', '10 # only'];

/**
 * Copies a file as an APFS clone where the file system can, which is fast and takes no space. Where it cannot,
 * COPYFILE_FICLONE copies the file in full, which is meant: the workload is then written out, about 1 GB.
 */
async function clone(source, destination) {
  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(source, destination, constants.COPYFILE_FICLONE);
}

async function writeTruncated(source, destination, bytes) {
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, (await readFile(source)).subarray(0, bytes));
}

async function sha256(file) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}

async function filesUnder(directory) {
  const entries = await readdir(directory, { recursive: true, withFileTypes: true });
  return entries.filter(entry => entry.isFile())
    .map(entry => path.join(entry.parentPath, entry.name))
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

async function makeLarge(directory) {
  for (let folder = 0; folder < folderNames.length; folder++) {
    for (let index = 0; index < 30; index++) {
      const source = jpegSources[(folder * 30 + index) % jpegSources.length];
      // A third of each folder's photos are two levels down.
      const subfolder = index < 20 ? '' : path.join('nested', 'deeper #2');
      const name = `IMG_${String(folder + 1).padStart(2, '0')}${String(index).padStart(2, '0')}.JPG`;
      await clone(source, path.join(directory, folderNames[folder], subfolder, name));
    }
    // A Live Photos movie next to the photo of the same name, which the photo's popup offers to play.
    await clone(movieSource, path.join(directory, folderNames[folder], `IMG_${String(folder + 1).padStart(2, '0')}00.MOV`));
  }
  for (let index = 1; index <= 12; index++)
    await clone(heicSource, path.join(directory, 'HEIC 写真 #%', `HEIC_${String(index).padStart(2, '0')}.HEIC`));
  // Broken files, which the app reports and skips.
  await writeTruncated(jpegSources[0], path.join(directory, 'Broken', 'broken.JPG'), 65536);
  await writeTruncated(heicSource, path.join(directory, 'Broken', 'broken.HEIC'), 65536);
}

/** Makes the workloads in `outputDirectory`, replacing what is there, and returns their manifest. */
export async function makeWorkloads(outputDirectory) {
  await rm(outputDirectory, { recursive: true, force: true });
  const directories = {
    large: path.join(outputDirectory, 'large'),
    viewJpeg: path.join(outputDirectory, 'view-jpeg'),
    viewHeic: path.join(outputDirectory, 'view-heic'),
  };
  await makeLarge(directories.large);
  await clone(jpegSources[0], path.join(directories.viewJpeg, 'ビュー # 50% JPEG', '写真 # 50% IMG_4676.JPG'));
  await clone(heicSource, path.join(directories.viewHeic, 'ビュー # 50% HEIC', '写真 # 50% demo.heic'));

  const manifest = { generator: 'test/performance/workload.mjs', workloads: {} };
  for (const [name, directory] of Object.entries(directories)) {
    const files = [];
    for (const file of await filesUnder(directory))
      files.push({ path: path.relative(directory, file).split(path.sep).join('/'), bytes: (await stat(file)).size, sha256: await sha256(file) });
    const id = createHash('sha256').update(JSON.stringify(files)).digest('hex').slice(0, 16);
    manifest.workloads[name] = { id, directory, files: files.length, bytes: files.reduce((sum, file) => sum + file.bytes, 0), entries: files };
  }
  await writeFile(path.join(outputDirectory, 'manifest.json'), JSON.stringify(manifest, null, 2));
  return manifest;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const outputDirectory = process.argv[2];
  if (!outputDirectory || !path.isAbsolute(outputDirectory)) throw new Error('Usage: node test/performance/workload.mjs <absolute output directory>');
  const manifest = await makeWorkloads(outputDirectory);
  for (const [name, workload] of Object.entries(manifest.workloads))
    console.log(`${name}: id ${workload.id}, ${workload.files} files, ${(workload.bytes / 1e6).toFixed(1)} MB`);
}
