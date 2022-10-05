import * as http from 'http';
import * as nodeStatic from 'node-static';
import * as portscanner from 'portscanner';
import { createPrependedLogger } from '../../src-shared/log/create-prepended-logger';
import { LiveReload } from '../live-reload';
import { FileServerPortNumber } from './file-server-port-number';

const fileServerLogger = createPrependedLogger('[File Server]');

// Using 127.0.0.1 instead of localhost in order to avoid the case that localhost resolves to IPv6 address.
// Also, note that portscanner uses 127.0.0.1 instead of localhost for some reason.
// See https://github.com/baalexander/node-portscanner/pull/14
const ipv4Localhost = '127.0.0.1';

async function findAvailablePort(): Promise<number> {
  try {
    FileServerPortNumber.found = await portscanner.findAPortNotInUse(FileServerPortNumber.default, FileServerPortNumber.max, ipv4Localhost);
    FileServerPortNumber.searchStatus = 'Succeeded';
    fileServerLogger.info(`Found an available port.`);
    fileServerLogger.info(`Found Port Number: ${FileServerPortNumber.found}`);
    fileServerLogger.info(`Default Port Number: ${FileServerPortNumber.default}`);
    fileServerLogger.info(`Found Port Number - Default Port Number = ${FileServerPortNumber.foundMinusDefault}`);
  }
  catch (error) {
    FileServerPortNumber.searchStatus = 'Failed';
    fileServerLogger.error('Failed to find an available port.', error);
  }
  return FileServerPortNumber.found;
}

async function launchFileServer(): Promise<string> {
  const portNumber = await findAvailablePort();
  const file = new nodeStatic.Server(`${__dirname}/../../dist`);
  http.createServer((request, response) => {
    request.addListener('end', () => {
      file.serve(request, response);
    }).resume();
  }).listen(portNumber);
  const url = `http://${ipv4Localhost}:${portNumber}`;
  fileServerLogger.info(`Launched the file server for ${url}`);
  return url;
}

export async function launchFileServerIfNeeded(): Promise<string> {
  if (LiveReload.enabled) {
    const url = `http://${ipv4Localhost}:4200`;
    fileServerLogger.info(`isLiveReloadMode === true, so "ng serve" command runs the server for ${url}`);
    return url;
  }

  return await launchFileServer();
}
