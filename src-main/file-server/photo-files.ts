import { net } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';
import { photoFilePathOf } from '../../src-shared/main-window-schemes.js';
import { plmThumbnailCacheDir } from '../../src-shared/thumbnail/cache/thumbnail-cache-util.js';
import { isInFolder, isInUserChosenFolder } from '../ipc/user-chosen-folders.js';

// TL;DR: The main window's page gets the user's photos and their thumbnails from plm-file:, which answers only for the
// files of the folders that the user opened and for the thumbnails that the app made.
// Details: The page showed them from their file: URLs, which a page of plm-app: may load only with the window's
// webSecurity off; with it off, the page could load any file of the computer. With webSecurity on, a file: URL does
// not load at all ("Not allowed to load local resource"), and this scheme is the page's one way to a file, which the
// main process answers as the other requests of the page about files are (src-main/ipc/user-chosen-folders.ts).

/** Whether the page may show the file at `filePath`: one in a folder that the user opened, or a thumbnail of the app's. */
export function mayShowFile(filePath: string): boolean {
  return isInUserChosenFolder(filePath) || isInFolder(filePath, plmThumbnailCacheDir);
}

/**
 * The file that a request of the page for a photo or a thumbnail stands for (photoFileUrl), if the page may show it:
 * a file, by its absolute path; otherwise 404, which does not tell whether such a file is there. Only to be read.
 */
export async function respondToPhotoFileRequest(request: Request, mayShow = mayShowFile): Promise<Response> {
  if (request.method !== 'GET')
    return new Response(null, { status: 405 });

  const requestedPath = photoFilePathOf(request.url);
  if (!requestedPath || !path.isAbsolute(requestedPath))
    return notFound();
  // Resolved, so that ".." in the path cannot leave the folder that it seems to be in.
  const filePath = path.resolve(requestedPath);
  if (!mayShow(filePath))
    return notFound();
  const isFile = await fs.promises.stat(filePath).then(stats => stats.isFile(), () => false);
  if (!isFile)
    return notFound();
  return net.fetch(pathToFileURL(filePath).href, { bypassCustomProtocolHandlers: true });
}

function notFound(): Response {
  return new Response(null, { status: 404 });
}
