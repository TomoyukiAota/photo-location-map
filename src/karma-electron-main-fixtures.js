// This file is for karma-electron to initialize @electron/remote in the Electron main process.
// Without this file, karma-electron hangs.

require('@electron/remote/main').initialize();
