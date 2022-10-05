// This app finds an available port from ephemeral ports and launches the file server using the found port.
// The range of ephemeral ports is from 49152 to 65535.
// See https://en.wikipedia.org/wiki/Ephemeral_port
// -------------------------------------------------------------
// The app launches faster when the default port can be used.
// It takes a few seconds to launch if the default port is already in use.
// (e.g. some app using the same port, or running multiple instances of this app)
// Therefore, the default port number is chosen so that
// 1) other apps do not seem to use, and
// 2) it's still easy to read in the log (i.e. not a random number like 52493).

const defaultPortNumber = 50100;

export class FileServerPortNumber {
  public static readonly default = defaultPortNumber;
  public static readonly max = 65535; // Max ephemeral port number
  public static found = defaultPortNumber;
  public static searchStatus: 'Succeeded' | 'Failed' | 'Not searched yet' = 'Not searched yet';

  public static get foundMinusDefault() {
    return this.found - this.default;
  }
}
