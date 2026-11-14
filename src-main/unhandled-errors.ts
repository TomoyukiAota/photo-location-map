import { app, clipboard, dialog } from 'electron';
import * as os from 'os';
import * as path from 'path';
import { pathToFileURL } from 'url';
import { inspect } from 'util';
import { recordUnhandledError } from '../src-shared/analytics/record-error.js';
import english from '../src-shared/i18n/locales/en.json' with { type: 'json' };
import type { TranslationKey } from '../src-shared/i18n/translation-key.js';
import { Logger } from '../src-shared/log/logger.js';

/** What Node tells the main process of: an exception that nothing caught, or a rejection that nothing handled. */
export type UnhandledErrorKind = 'Unhandled Error' | 'Unhandled Promise Rejection';

/** What handles an unhandled error, which a test replaces. */
export interface UnhandledErrorHandlers {
  log: (kind: UnhandledErrorKind, error: Error) => void;
  record: (error: Error) => void;
  isReady: () => boolean;
  showMessageBox: (options: Electron.MessageBoxSyncOptions) => number;
  showErrorBox: (title: string, content: string) => void;
  copy: (text: string) => void;
  homeFolder: () => string;
}

const handlers: UnhandledErrorHandlers = {
  log: (kind, error) => Logger.errorNotRecorded(
    `${kind}. error.name: ${error.name}, error.message: ${error.message}, error.stack: ${error.stack}`, error),
  record: error => recordUnhandledError(error, 'Main'),
  isReady: () => app.isReady(),
  showMessageBox: options => dialog.showMessageBoxSync(options),
  showErrorBox: (title, content) => dialog.showErrorBox(title, content),
  copy: text => clipboard.writeText(text),
  homeFolder: () => os.homedir(),
};

type Translate = (key: TranslationKey) => string;

// TL;DR: The dialog is in English until the language is decided, then in the application's language.
// Details: The handlers are set before the setups whose errors they catch (src-main/electron-main.ts), and the
// language needs some of those: src-shared/i18n/i18n.ts decides it from the settings when it is first imported, so
// importing it here would decide it before the settings could be read. The English texts are those of en.json.
let translate: Translate = key => key.split('.').reduce<any>((texts, name) => texts[name], english);

/** Shows the dialog in the application's language from now on; src-main/i18n/i18n-setup.ts calls it. */
export function translateUnhandledErrorDialog(t: Translate): void {
  translate = t;
}

/**
 * Logs and records an error that nothing handled in the main process, and shows it in a dialog.
 * TL;DR: The dialog says in the user's language that an error occurred, and gives its details, which stay in English.
 * Details: The details are the kind of error and its stack, as the log has them, with the home folder written as ~;
 * a button copies them, with the message, for a report. Nothing here throws, as the listener of uncaughtException
 * that calls this would end the process: a step that fails is written to the console, and the next steps are taken.
 */
export function handleUnhandledError(kind: UnhandledErrorKind, value: unknown, use = handlers): void {
  const error = asError(value);
  attempt('Logging', () => use.log(kind, error));
  attempt('Recording', () => use.record(error));
  attempt('Showing', () => showDialog(kind, error, use));
}

function attempt(step: string, action: () => void): void {
  try {
    action();
  } catch (failure) {
    console.error(`${step} an unhandled error failed:`, failure);
  }
}

function showDialog(kind: UnhandledErrorKind, error: Error, use: UnhandledErrorHandlers): void {
  const message = translate('unhandledError.message');
  const detail = `${kind}\n${withHomeAsTilde(error.stack || `${error.name}: ${error.message}`, use.homeFolder())}`;

  // Before the app is ready, only the error box can be shown. On Linux, Electron writes it to stderr.
  if (!use.isReady()) {
    use.showErrorBox(message, detail);
    return;
  }

  const response = use.showMessageBox({
    type: 'error',
    // Without a title, which macOS does not show: the message says what happened.
    message,
    detail,
    buttons: [translate('common.ok'), translate('unhandledError.copyError')],
    defaultId: 0,
    noLink: true,
  });
  if (response === 1)
    use.copy(`${message}\n${detail}`);
}

/** A value that a promise was rejected with, which need not be an error, as an error that says what it was. */
class NonError extends Error {
  constructor(value: unknown) {
    super(inspect(value));
    this.name = 'NonError';
    Error.captureStackTrace(this, NonError);
  }
}

function asError(value: unknown): Error {
  return value instanceof Error ? value : new NonError(value);
}

/** The text with the home folder written as ~, both as a path and as the file URL in a stack's frames. */
function withHomeAsTilde(text: string, home: string): string {
  if (!home)
    return text;
  return text
    .split(`${pathToFileURL(home).href}/`).join('~/')
    .split(`${home}${path.sep}`).join(`~${path.sep}`);
}
