import * as http from 'http';
import * as nodeStatic from 'node-static';
import * as portscanner from 'portscanner';
import { createPrependedLogger } from '../src-shared/log/create-prepended-logger';

const fileServerLogger = createPrependedLogger('[File Server]');

// Using 127.0.0.1 instead of localhost in order to avoid the case that localhost resolves to IPv6 address.
// Also, note that portscanner uses 127.0.0.1 instead of localhost for some reason.
// See https://github.com/baalexander/node-portscanner/pull/14
const ipv4Localhost = '127.0.0.1';

async function findAvailablePort(): Promise<number> {
  // The range of ephemeral ports is from 49152 to 65535.
  // See https://en.wikipedia.org/wiki/Ephemeral_port
  // -------------------------------------------------------------
  // The app launches faster when the default port can be used.
  // In case the default port is already in use
  // (e.g. some app using the same port, or running multiple instances of this app),
  // it takes a few seconds to launch.
  // Therefore, the default port number is chosen so that
  // 1) other apps do not seem to use, and
  // 2) it's still easy to read in the log (i.e. not a random number like 52493).

  const defaultPortNumber = 50100;
  const maxEphemeralPortNumber = 65535;
  let portNumber = defaultPortNumber;   //TODO: Track the port number using Analytics.
  try {
    portNumber = await portscanner.findAPortNotInUse(defaultPortNumber, maxEphemeralPortNumber, ipv4Localhost);
    fileServerLogger.info(`Found an available port. Port Number: ${portNumber}`);
  }
  catch (error) {
    fileServerLogger.error('Failed to find an available port.', error);
  }
  return portNumber;
}

async function launchFileServer(): Promise<string> {
  const portNumber = await findAvailablePort();
  const file = new nodeStatic.Server(`${__dirname}/../dist`);
  http.createServer((request, response) => {
    request.addListener('end', () => {
      file.serve(request, response);
    }).resume();
  }).listen(portNumber);
  const url = `http://${ipv4Localhost}:${portNumber}`;
  fileServerLogger.info(`Launched the file server for ${url}`);
  return url;
}

export async function launchFileServerIfNeeded(isLiveReloadMode: boolean): Promise<string> {
  if (isLiveReloadMode) {
    const url = `http://${ipv4Localhost}:4200`;
    fileServerLogger.info(`isLiveReloadMode === true, so "ng serve" command runs the server for ${url}`);
    return url;
  }

  return await launchFileServer();
}
