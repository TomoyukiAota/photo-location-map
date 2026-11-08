// The test build replaces only the legacy platform boundary. It retains a
// genuine Node/jsdom process; renderer identity assertions run in Electron.
import * as os from 'node:os';
import * as path from 'node:path';
import * as electron from './electron-double';

export class ProxyRequire {
  public static electron = electron as unknown as typeof import('electron');
  public static os = os;
  public static path = path;
}
