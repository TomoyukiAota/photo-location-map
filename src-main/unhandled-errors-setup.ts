import { handleUnhandledError } from './unhandled-errors.js';

// TL;DR: An error that nothing handles in the main process is logged, recorded and shown, from the start.
// Details: src-main/electron-main.ts imports this before the setups whose errors it is to catch. Nothing that this
// imports awaits at its top level, so the listeners are set before Node evaluates the imports that follow it: an
// await there would let them run first. The dialog's texts follow the language once it is decided
// (src-main/unhandled-errors.ts).
process.on('uncaughtException', error => handleUnhandledError('Unhandled Error', error));
process.on('unhandledRejection', reason => handleUnhandledError('Unhandled Promise Rejection', reason));
