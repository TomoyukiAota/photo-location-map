import { ipcMain, IpcMainInvokeEvent } from 'electron';
import type { HeifEmbeddedThumbnail, HeifWholeImage } from '../../src-shared/heif/heif-images.js';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants.js';
import { logged } from '../../src-shared/log/logged-line.js';
import { Logger } from '../../src-shared/log/logger.js';
import { assertFromMainWindow } from '../ipc/ipc-sender.js';
import { isInUserChosenFolder } from '../ipc/user-chosen-folders.js';
import { decodeEmbeddedThumbnailToJpeg } from './embedded-thumbnail-decoder.js';
import { readEmbeddedThumbnail, readWholeImage } from './heif-file.js';

// The images of the HEIF photos of a folder that the user opened, which the main window's page shows as their
// thumbnails (src/app/heif-thumbnail/). Each answer is null when the file has no such image or cannot be read: the
// page then makes the thumbnail another way, the last of which, the generation of thumbnails, records failures.

function assertPhotoOfOpenedFolder(event: IpcMainInvokeEvent, filePath: unknown, operation: string): asserts filePath is string {
  assertFromMainWindow(event, operation);
  if (!isInUserChosenFolder(filePath))
    throw new Error(`${operation} needs the path of a file in a folder that the user opened.`);
}

async function orNull<T>(filePath: string, what: string, read: () => Promise<T | null>): Promise<T | null> {
  try {
    return await read();
  } catch (error) {
    Logger.info(logged`The ${what} of "${filePath}" cannot be read: ${error}`);
    return null;
  }
}

ipcMain.handle(IpcConstants.Heif.EmbeddedThumbnail, (event, filePath: unknown): Promise<HeifEmbeddedThumbnail | null> => {
  assertPhotoOfOpenedFolder(event, filePath, 'Reading the thumbnail item of a HEIF file');
  return orNull(filePath, 'thumbnail item', () => readEmbeddedThumbnail(filePath));
});

ipcMain.handle(IpcConstants.Heif.EmbeddedThumbnailJpeg, (event, filePath: unknown): Promise<Uint8Array | null> => {
  assertPhotoOfOpenedFolder(event, filePath, 'Decoding the thumbnail item of a HEIF file');
  return orNull(filePath, 'decoded thumbnail item', async () => {
    // The page shows a JPEG item itself, turned as the file says.
    const thumbnail = await readEmbeddedThumbnail(filePath);
    return thumbnail?.kind === 'hevc' ? decodeEmbeddedThumbnailToJpeg(thumbnail) : null;
  });
});

ipcMain.handle(IpcConstants.Heif.WholeImage, (event, filePath: unknown): Promise<HeifWholeImage | null> => {
  assertPhotoOfOpenedFolder(event, filePath, 'Reading the image of a HEIF file');
  return orNull(filePath, 'image', () => readWholeImage(filePath));
});
