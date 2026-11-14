import { net } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';
import { photoFilePathOf } from '../../src-shared/main-window-schemes.js';
import { plmThumbnailCacheDir } from '../../src-shared/thumbnail/cache/thumbnail-cache-util.js';
import { userChosenFolderPaths } from '../ipc/user-chosen-folders.js';

// TL;DR: The main window's page gets the user's photos and their thumbnails from plm-file:, which answers only for the
// files of the folders that the user opened and for the thumbnails that the app made.
// Details: The page showed them from their file: URLs, which a page of plm-app: may load only with the window's
// webSecurity off; with it off, the page could load any file of the computer. With webSecurity on, a file: URL does
// not load at all ("Not allowed to load local resource"), and this scheme is the page's one way to a file, which the
// main process answers as the other requests of the page about files are (src-main/ipc/user-chosen-folders.ts). The
// paths are compared, and the file is read, with their links followed: a link in an opened folder to a file or a
// folder elsewhere does not take the page there. They are compared as they are, case and all: a real path has the
// case of the file system, so that a path written in another case on a file system that ignores case comes to the
// same, and two folders whose names differ in case only, on one that does not, stay two.

/**
 * The real path of the file at `filePath`, with its links followed, if it is in one of `folders`, whose links are
 * followed too; otherwise undefined.
 */
export async function showablePathIn(filePath: string, folders: readonly string[]): Promise<string | undefined> {
  const realFile = await realPath(filePath);
  if (!realFile)
    return undefined;
  for (const folder of folders) {
    const realFolder = await realPath(folder);
    if (realFolder && isWithinRealFolder(realFile, realFolder))
      return realFile;
  }
  return undefined;
}

/** The real path of a file that the page may show: one in a folder that the user opened, or a thumbnail of the app's. */
export function showablePath(filePath: string): Promise<string | undefined> {
  return showablePathIn(filePath, [...userChosenFolderPaths(), plmThumbnailCacheDir]);
}

/**
 * The file that a request of the page for a photo or a thumbnail stands for (photoFileUrl), if the page may show it:
 * a file, by its absolute path; otherwise 404, which does not tell whether such a file is there. Only to be read.
 */
export async function respondToPhotoFileRequest(request: Request, showable = showablePath): Promise<Response> {
  if (request.method !== 'GET')
    return new Response(null, { status: 405 });

  const requestedPath = photoFilePathOf(request.url);
  if (!requestedPath || !path.isAbsolute(requestedPath))
    return notFound();
  // The path that was checked is the one read, so that a link cannot lead elsewhere between the two.
  const filePath = await showable(requestedPath);
  if (!filePath)
    return notFound();
  const isFile = await fs.promises.stat(filePath).then(stats => stats.isFile(), () => false);
  if (!isFile)
    return notFound();
  return net.fetch(pathToFileURL(filePath).href, { bypassCustomProtocolHandlers: true });
}

/** Whether the real path `realFile` is the real path `realFolder`, or is in it, by their case as the file system has it. */
export function isWithinRealFolder(realFile: string, realFolder: string): boolean {
  const prefix = realFolder.endsWith(path.sep) ? realFolder : realFolder + path.sep;
  return realFile === realFolder || realFile.startsWith(prefix);
}

function realPath(filePath: string): Promise<string | undefined> {
  return fs.promises.realpath(filePath).catch(() => undefined);
}

function notFound(): Response {
  return new Response(null, { status: 404 });
}
