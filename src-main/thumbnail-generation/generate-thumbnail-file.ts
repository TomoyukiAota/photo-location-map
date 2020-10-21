import { expose } from 'threads/worker';
import { promisify } from 'util';
import { ThumbnailFileGenerationArgs, ThumbnailFileGenerationResult } from './generate-thumbnail-file-arg-and-result';


expose(async function generateThumbnailFile(args: ThumbnailFileGenerationArgs)  {
  console.log('worker therad', args);

  if (!args)
    return;

  // Requiring heic-convert here because this module is premature and untrustworthy as of Oct 21, 2020.
  // When this module is imported at the top of the file, the application terminates right after launching it.
  // Importing heic-convert appears to enable the option to terminate the application
  // for unhandled promise rejection, and the unhandled promise comes from electron-updater.
  // When this kind of butterfly effect is shown at application launch, it is very difficult to debug.
  // Therefore, importing heic-convert here to be able to track when things go wrong.
  const heicConvert: typeof import('heic-convert') = require('heic-convert');

  const fs = require('fs-extra');
  const inputBuffer = await promisify(fs.readFile)(args.srcFilePath);
  const outputBuffer = await heicConvert({
    buffer: inputBuffer, // the HEIC file buffer
    format: 'JPEG',      // output format
    quality: 0.1           // the jpeg compression quality, between 0 and 1
  });

  await fs.ensureDir(args.outputFileDir);
  await promisify(require('fs').writeFile)(args.outputFilePath, outputBuffer).catch(err => console.log(err));

  const result = new ThumbnailFileGenerationResult();
  result.success = true;
  return result;
});
