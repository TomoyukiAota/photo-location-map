import { pathOfAddress } from './url/address-path.js';

// The schemes of the main window's page, which the main process answers (src-main/file-server/) and registers with
// their privileges (src-main/privileged-schemes-setup.ts), and which the page and the analytics of its errors know.

/** The scheme of the app's page, served from the app's build: plm-app://app/index.html. */
export const appPageScheme = 'plm-app';
/** The origin of the app's page, before the path of a file of its build. */
export const appPageOrigin = `${appPageScheme}://app`;

/** The origin of the page in live reload, which ng serve serves (src-main/file-server/file-server.ts). */
export const devServerPageOrigin = 'http://localhost:4200';

/** The scheme of the user's photos and of the thumbnails that the app made, as the page shows them. */
export const photoFileScheme = 'plm-file';
const photoFileOrigin = `${photoFileScheme}://local`;

/**
 * The address of a photo or of a thumbnail for an img element of the page: its whole path in one segment, escaped,
 * so that a character of a path, as "#", "%", "?" or a Windows backslash, stays the path's. Every character but
 * letters, digits and "-._~" is escaped, those that encodeURIComponent keeps ("!'()*") too, so that
 * photoFileAddressPattern takes an address whole.
 */
export function photoFileUrl(filePath: string): string {
  const escaped = encodeURIComponent(filePath).replace(/[!'()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
  return `${photoFileOrigin}/${escaped}`;
}

/**
 * The address of a thumbnail that the app made of a photo, in its cache, `longerSide` pixels on its longer side.
 * TL;DR: photoFileUrl with the size in its query, which photoFilePathOf leaves out, so that a thumbnail made again at
 * another size is loaded anew.
 * Details: A thumbnail of each size is kept in the same file (src-main/thumbnail-generation/thumbnail-state.ts), and
 * the page keeps every image that it loaded, by its address, for the rest of the session: at the same address, it
 * would show the previous size's. The size is the one that the file was made at, which the services that know of the
 * file keep with it, not the one that the settings choose now: they choose the new one a moment before the services
 * have forgotten the files of the previous one.
 */
export function madeThumbnailUrl(filePath: string, longerSide: number): string {
  return `${photoFileUrl(filePath)}?size=${longerSide}`;
}

/**
 * An address of photoFileUrl, whole, in a text such as a console message, which holds the path of a user's file: the
 * analytics of errors take it as a path (src-shared/analytics/error-for-analytics.ts).
 */
export const photoFileAddressPattern = /\bplm-file:\/\/[\w.~%/-]*/gi;

/** The path that an address of photoFileUrl stands for; undefined for any other address, or an escape that is not one. */
export function photoFilePathOf(url: string): string | undefined {
  return pathOfAddress(url, photoFileOrigin);
}
