import { DirectoryTree } from 'directory-tree';
import { ipcMain } from 'electron';
import { spawn, Thread, Worker } from 'threads';
import * as pathModule from 'path';
import * as allSettled from 'promise.allsettled';

import { IpcConstants } from '../../src-shared/ipc/ipc-constants';
import { convertToFlattenedDirTree } from '../../src-shared/dir-tree/dir-tree-util';
import { FilenameExtension } from '../../src-shared/filename-extension/filename-extension';
import { ThumbnailFileGenerationArgs } from './generate-thumbnail-file-arg-and-result';

function getThumbnailOutputPath(filePath: string) {
  const parsedPath = pathModule.parse(filePath);
  const thumbnailFileName = `${parsedPath.name}_plmThumb`;
  const intermediateDir = pathModule.parse(
    filePath.replace(':', '') // Replace C:\\abc\\def.jpg to C\\abc\\def.jpg
  ).dir;                                          // Get C\\abc\\def from C\\abc\\def.jpg
  const outputDir = pathModule.join('C:', 'plmTemp', intermediateDir);
  const outputPath = pathModule.join(outputDir, `${thumbnailFileName}.jpg`);
  console.log(outputPath);
  return { outputDir, outputPath };
}

async function generateThumbnails(heifFiles: DirectoryTree[]) {
  const promiseArray = heifFiles.map(async file => {
    console.log(`heifFile`, file);

    const generateThumbnailFile = await spawn(new Worker('./generate-thumbnail-file'));

    const args = new ThumbnailFileGenerationArgs();
    args.srcFilePath = file.path;
    const { outputDir, outputPath } = getThumbnailOutputPath(file.path);
    args.outputFileDir = outputDir;
    args.outputFilePath = outputPath;

    console.log('before await generateThumbnailFile(args);');
    const result = await generateThumbnailFile(args);

    await Thread.terminate(generateThumbnailFile);

    return;
  });

  await allSettled(promiseArray);
}

ipcMain.handle(IpcConstants.ThumbnailGenerationInMainProcess.Name, (event, directoryTreeObject: DirectoryTree) => {
  const flattenedDirTree = convertToFlattenedDirTree(directoryTreeObject);
  console.log(flattenedDirTree);
  const heifFiles = flattenedDirTree.filter(element => FilenameExtension.isHeif(element.extension));
  console.log(`heifFiles`);
  console.log(heifFiles);

  // noinspection JSUnusedLocalSymbols
  const ignoredPromise = generateThumbnails(heifFiles);    // Promise is deliberately ignored.

  return;
});
