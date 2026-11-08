/**
 * Node.js's path.isAbsolute on `platform`, without Node.js, for the renderer: path.win32.isAbsolute on Windows, which
 * also takes a path from the root of the current drive (\folder) and a UNC path (\\server\share), path.posix's elsewhere.
 */
export function isAbsolutePath(path: string, platform: string): boolean {
  if (platform === 'win32')
    return /^[\\/]/.test(path) || /^[a-zA-Z]:[\\/]/.test(path);
  return path.startsWith('/');
}
