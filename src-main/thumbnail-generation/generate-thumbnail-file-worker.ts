import * as fsExtra from 'fs-extra';
import * as workerpool from 'workerpool';
import { Now } from '../../src-shared/date-time/now';
import { ThumbnailFileGenerationArg, ThumbnailFileGenerationResult } from './generate-thumbnail-file-arg-and-result';


class WorkerLogger {
  public info(message: string, ...obj: any[]) {
    console.info(`[${Now.extendedFormat}] [Worker] [info] [Thumbnail Generation] ${message}`, ...obj);
  }

  public warn(message: string, ...obj: any[]) {
    console.warn(`[${Now.extendedFormat}] [Worker] [warn] [Thumbnail Generation] ${message}`, ...obj);
  }

  public error(message: string, ...obj: any[]) {
    console.error(`[${Now.extendedFormat}] [Worker] [error] [Thumbnail Generation] ${message}`, ...obj);
  }
}

const logger = new WorkerLogger();

async function generateThumbnailFile(arg: ThumbnailFileGenerationArg): Promise<ThumbnailFileGenerationResult> {
  logger.info(`A worker is started to generate thumbnail for ${arg.srcFilePath}`);

  if (!arg) {
    return new ThumbnailFileGenerationResult('null-arg');
  }

  let inputBuffer: Buffer;
  try {
    inputBuffer = await fsExtra.promises.readFile(arg.srcFilePath);
  } catch (error) {
    logger.error(`Failed to read source file for thumbnail generation. Source file path is "${arg.srcFilePath}". error: ${error}`, error);
    return new ThumbnailFileGenerationResult('failed-to-read-src-file');
  }

  // Requiring heic-convert here because this module is premature as of Oct 21, 2020.
  // When this module is imported at the top of the file, the application terminates right after launching it.
  // Importing heic-convert appears to enable the option to terminate the application
  // for unhandled promise rejection, and the unhandled promise comes from electron-updater.
  // When this kind of butterfly effect is shown at application launch, it is very difficult to debug.
  // Therefore, importing heic-convert here to be able to track when things go wrong.
  const heicConvert: typeof import('heic-convert') = require('heic-convert');

  // The value of jpegQuality is empirically set so that the generated thumbnail looks good.
  // When the value is decreased, the file size of generated thumbnails will be decreased,
  // but the gradation will be more step-like and look ugly.
  // 0.3 is the least value that the gradation looks okay with a small dimensions for thumbnails (where width and height are 200px at maximum).
  // 0.5 is the value that the gradation is okay with larger dimensions.
  // 0.5 is chosen considering the future possibility of implementing user-settable dimensions for thumbnails.
  const jpegQuality = 0.5;

  let outputBuffer: Buffer;
  try {
    outputBuffer = await heicConvert({
      buffer: inputBuffer,     // the HEIC file buffer
      format: 'JPEG',          // output format
      quality: jpegQuality,    // the jpeg compression quality, between 0 and 1
    });
  } catch (error) {
    logger.error(`Failed in heic-convert. error: ${error}`, error);
    return new ThumbnailFileGenerationResult('failed-in-heic-convert');
  }

  try {
    await fsExtra.ensureDir(arg.outputFileDir);
  } catch (error) {
    logger.error(`Failed to ensure thumbnail directory exists. Directory path is "${arg.outputFileDir}". error: ${error}`, error);
    return new ThumbnailFileGenerationResult('failed-to-ensure-dir');
  }

  try {
    await fsExtra.promises.writeFile(arg.outputFilePath, outputBuffer);
  } catch (error) {
    logger.error(`Failed to write the file for thumbnail in "${arg.outputFilePath}". error: ${error}`, error);
    return new ThumbnailFileGenerationResult('failed-to-write-thumbnail-file');
  }

  logger.info(`Created the file for thumbnail in "${arg.outputFilePath}".`);
  return new ThumbnailFileGenerationResult('success');
}

workerpool.worker({
  generateThumbnailFile: generateThumbnailFile,
});
