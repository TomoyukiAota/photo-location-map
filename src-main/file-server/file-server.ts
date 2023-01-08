import * as path from 'path';
import { createPrependedLogger } from '../../src-shared/log/create-prepended-logger';
import { LiveReload } from '../live-reload';

const fileServerLogger = createPrependedLogger('[File Server]');

export async function getUrlForMainWindow(): Promise<string> {
  if (LiveReload.enabled) {
    const url = `http://localhost:4200`;
    fileServerLogger.info(`isLiveReloadMode === true, so "ng serve" command runs the server for ${url}`);
    return url;
  }

  // In order to switch from file protocol to http protocol,
  // the file server is implemented in October 2022, but there are port issues
  // which randomly happen notably with Windows Update and are difficult to handle.
  //  - https://stackoverflow.com/a/63810451/7947548
  //  - https://stackoverflow.com/q/48478869/7947548
  // Therefore, the file server implementation is removed, and file protocol continues to be used.
  const urlObj = new URL(path.join('file:', __dirname, '..', '..', 'dist', 'index.html'));
  const url = urlObj.href;
  fileServerLogger.info(`isLiveReloadMode === false, so the file URL is used. ${url}`);
  return url;
}
