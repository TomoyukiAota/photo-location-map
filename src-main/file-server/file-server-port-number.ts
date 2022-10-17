// This app finds an available port and launches the file server using the found port.
// -------------------------------------------------------------
// For the initial implementation of the file server, the default port was set to 50100
// because 50100 is within the range of the ephemeral ports (49152-65535).
// However, Windows Update seems to use this range of ports, and in case Windows Update uses the same port,
// the code to find the available port results in the error like "Error: listen EACCES: permission denied 0.0.0.0:50100"
// A similar issue is mentioned in the Stack Overflow thread https://stackoverflow.com/a/63810451/7947548
// It's difficult to reproduce and investigate the error because Windows Update needs to take place.
// Therefore, as of Oct 17, 2022, it's set to 40100 hoping that Windows Update does not use this port.
// -------------------------------------------------------------
// The app launches faster when the default port can be used.
// It takes a few seconds to launch if the default port is already in use.
// (e.g. some app using the same port, or running multiple instances of this app)
// Therefore, the default port number is chosen so that
// 1) other apps do not seem to use, and
// 2) it's still easy to read in the log (i.e. not a random number like 52493).

const defaultPortNumber = 40100;

export class FileServerPortNumber {
  public static readonly default = defaultPortNumber;
  public static readonly max = 65535; // Max ephemeral port number
  public static found = defaultPortNumber;
  public static searchStatus: 'Succeeded' | 'Failed' | 'Not searched yet' = 'Not searched yet';

  public static get foundMinusDefault() {
    return this.found - this.default;
  }
}
