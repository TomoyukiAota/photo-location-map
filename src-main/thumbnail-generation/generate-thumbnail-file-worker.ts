import * as fsExtra from 'fs-extra';
import { expose } from 'threads/worker';
import { ThumbnailFileGenerationArgs, ThumbnailFileGenerationResult } from './generate-thumbnail-file-arg-and-result';


expose(async function generateThumbnailFile(args: ThumbnailFileGenerationArgs): Promise<ThumbnailFileGenerationResult> {
  console.log(`[worker thread] A worker thread is created to generate thumbnail for ${args.srcFilePath}`);

  if (!args) {
    return new ThumbnailFileGenerationResult('null-args');
  }

  // Requiring heic-convert here because this module is premature as of Oct 21, 2020.
  // When this module is imported at the top of the file, the application terminates right after launching it.
  // Importing heic-convert appears to enable the option to terminate the application
  // for unhandled promise rejection, and the unhandled promise comes from electron-updater.
  // When this kind of butterfly effect is shown at application launch, it is very difficult to debug.
  // Therefore, importing heic-convert here to be able to track when things go wrong.
  const heicConvert: typeof import('heic-convert') = require('heic-convert');

  const inputBuffer = await fsExtra.promises.readFile(args.srcFilePath);
  const outputBuffer = await heicConvert({
    buffer: inputBuffer, // the HEIC file buffer
    format: 'JPEG',      // output format
    quality: 0.1           // the jpeg compression quality, between 0 and 1
  });

  await fsExtra.ensureDir(args.outputFileDir);
  await fsExtra.promises.writeFile(args.outputFilePath, outputBuffer).catch(err => {
    console.log(`[worker thread] Something went wrong when writing a file for thumbnail in "${args.outputFilePath}"`, err);
  });

  return new ThumbnailFileGenerationResult('success');
});
