import * as fsExtra from 'fs-extra';
import { expose } from 'threads/worker';
import { ThumbnailFileGenerationArgs, ThumbnailFileGenerationResult } from './generate-thumbnail-file-arg-and-result';


class WorkerThreadLogger {
  public info(message: string, ...obj: any[]) {
    console.info(`[worker thread] ${message}`, ...obj);
  }

  public warn(message: string, ...obj: any[]) {
    console.warn(`[worker thread] ${message}`, ...obj);
  }

  public error(message: string, ...obj: any[]) {
    console.error(`[worker thread] ${message}`, ...obj);
  }
}

const logger = new WorkerThreadLogger();

expose(async function generateThumbnailFile(args: ThumbnailFileGenerationArgs): Promise<ThumbnailFileGenerationResult> {
  logger.info(`A worker thread is created to generate thumbnail for ${args.srcFilePath}`);

  if (!args) {
    return new ThumbnailFileGenerationResult('null-args');
  }

  let inputBuffer: Buffer;
  try {
    inputBuffer = await fsExtra.promises.readFile(args.srcFilePath);
  } catch (error) {
    logger.error(`Failed to read source file for thumbnail generation. Source file path is "${args.srcFilePath}". error: ${error}`, error);
    return new ThumbnailFileGenerationResult('failed-to-read-src-file');
  }

  // Requiring heic-convert here because this module is premature as of Oct 21, 2020.
  // When this module is imported at the top of the file, the application terminates right after launching it.
  // Importing heic-convert appears to enable the option to terminate the application
  // for unhandled promise rejection, and the unhandled promise comes from electron-updater.
  // When this kind of butterfly effect is shown at application launch, it is very difficult to debug.
  // Therefore, importing heic-convert here to be able to track when things go wrong.
  const heicConvert: typeof import('heic-convert') = require('heic-convert');

  let outputBuffer: Buffer;
  try {
    outputBuffer = await heicConvert({
      buffer: inputBuffer, // the HEIC file buffer
      format: 'JPEG',      // output format
      quality: 0.1         // the jpeg compression quality, between 0 and 1
    });
  } catch (error) {
    logger.error(`Failed in heic-convert. error: ${error}`, error);
    return new ThumbnailFileGenerationResult('failed-in-heic-convert');
  }

  try {
    await fsExtra.ensureDir(args.outputFileDir);
  } catch (error) {
    logger.error(`Failed to ensure thumbnail directory exists. Directory path is "${args.outputFileDir}". error: ${error}`, error);
    return new ThumbnailFileGenerationResult('failed-to-ensure-dir');
  }

  try {
    await fsExtra.promises.writeFile(args.outputFilePath, outputBuffer);
  } catch (error) {
    logger.error(`Failed to write the file for thumbnail in "${args.outputFilePath}". error: ${error}`, error);
    return new ThumbnailFileGenerationResult('failed-to-write-thumbnail-file');
  }

  logger.info(`Created the file for thumbnail in "${args.outputFilePath}".`);
  return new ThumbnailFileGenerationResult('success');
});
