// The schemes of the main window's page, which the main process answers (src-main/file-server/) and registers with
// their privileges (src-main/privileged-schemes-setup.ts), and which the page and the analytics of its errors know.

/** The scheme of the app's page, served from the app's build: plm-app://app/index.html. */
export const appPageScheme = 'plm-app';
/** The origin of the app's page, before the path of a file of its build. */
export const appPageOrigin = `${appPageScheme}://app`;

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
 * An address of photoFileUrl, whole, in a text such as a console message, which holds the path of a user's file: the
 * analytics of errors take it as a path (src-shared/analytics/error-for-analytics.ts).
 */
export const photoFileAddressPattern = /\bplm-file:\/\/[\w.~%/-]*/gi;

/** The path that an address of photoFileUrl stands for; undefined for any other address, or an escape that is not one. */
export function photoFilePathOf(url: string): string | undefined {
  if (!url.startsWith(`${photoFileOrigin}/`))
    return undefined;
  try {
    return decodeURIComponent(url.slice(photoFileOrigin.length + 1).replace(/[?#][\s\S]*$/, ''));
  } catch {
    return undefined;
  }
}
