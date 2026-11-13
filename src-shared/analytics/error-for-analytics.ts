// Turns an error into an event label and value without any of the user's file paths, which can contain their
// name or the names of their folders and photos.
//  - The message keeps its words; anything that looks like a path becomes "<path>", including anything under
//    the user's home folder, a file's name with the extension of a photo or a movie becomes "<file>", and the
//    user name becomes "<user>".
//  - The stack keeps its first frames: function names, and file names only when the file is inside the app (the
//    app.asar bundle, the app's own folder, or the page served by the dev server); every other file location
//    becomes "<path>". The causes of the error follow it, and the first errors of an AggregateError.
//  - A thrown value that is not an error keeps its type, and an object its JSON with only the texts that are codes in
//    its diagnostic fields, such as "code".

export interface ErrorScrubbingContext {
  /** Folders of the app itself, whose files may be named in stacks (e.g. app.getAppPath()). */
  readonly appPaths: readonly string[];
  /** Strings that must not be sent, such as the home folder and the user name. */
  readonly sensitiveStrings: readonly string[];
}

export const maxLabelLength = 1000;
export const maxStackFrames = 20;
/** How many causes deep the value goes (error.cause), and how many errors of an AggregateError it gives. */
export const maxCauses = 3;
export const maxAggregatedErrors = 3;
/** The longest value: an error, its causes and their frames fit, far below what the analytics backend takes. */
export const maxValueLength = 16_000;

// The file types that the app opens, with those of Live Photos (src-shared/filename-extension/): a word that ends in
// one of them is the name of a user's file.
const fileExtensions = 'jpe?g|jpe|jfif?|jif|tiff?|png|heic|heif|webp|mov|mp4';
const quotedFileName = new RegExp(`(['"\`])[^'"\`]*\\.(?:${fileExtensions})\\1`, 'gi');
const fileName = new RegExp(`[^\\s'"\`()<>,;]+\\.(?:${fileExtensions})\\b`, 'gi');

export function scrubMessage(message: string, context: ErrorScrubbingContext): string {
  let result = replaceSensitiveStrings(message, context);
  // Quoted text with a path separator in it, such as ENOENT's "open '/Users/x/Pictures/a b.jpg'".
  result = result.replace(/(['"`])[^'"`]*[\\/][^'"`]*\1/g, (_match, quote: string) => `${quote}<path>${quote}`);
  // A quoted file name, which can have spaces: "'IMG 0001.jpg'".
  result = result.replace(quotedFileName, (_match, quote: string) => `${quote}<file>${quote}`);
  // TL;DR: An unquoted path in the home folder goes to the end of its line.
  // Details: Where such a path ends cannot be told, as its folders' names can have spaces ("~/Pictures/Trip to
  // Kyoto"), and the user's files are in the home folder. Words after it on the line are lost with it.
  result = result.replace(/~[\\/][^\n'"`]*/g, '<path>');
  // Anything else with a path separator, such as an unquoted path or URL.
  result = result.replace(/[^\s'"`()<>,;]*[\\/][^\s'"`()<>,;]*/g, token => token === '/' ? token : '<path>');
  // A file name by itself.
  result = result.replace(fileName, '<file>');
  return result;
}

export function scrubStack(stack: string, context: ErrorScrubbingContext): string {
  return stack
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('at '))
    .slice(0, maxStackFrames)
    .map(line => scrubFrame(line, context))
    .join('\n');
}

/** "at fn (location)" or "at location", where location is "file:line:column". */
function scrubFrame(frame: string, context: ErrorScrubbingContext): string {
  const withFunction = /^at (.+?) \((.*)\)$/.exec(frame);
  const functionName = withFunction ? withFunction[1] : undefined;
  const location = withFunction ? withFunction[2] : frame.slice('at '.length);
  const scrubbedLocation = scrubLocation(location, context);
  const scrubbedFunctionName = functionName === undefined ? undefined : scrubMessage(functionName, context);
  return scrubbedFunctionName === undefined
    ? `at ${scrubbedLocation}`
    : `at ${scrubbedFunctionName} (${scrubbedLocation})`;
}

function scrubLocation(location: string, context: ErrorScrubbingContext): string {
  const match = /^(.*?)(:\d+:\d+)?$/.exec(location);
  const file = match[1];
  const lineAndColumn = match[2] || '';
  return `${scrubFile(file, context)}${lineAndColumn}`;
}

/** A file of a stack or of the console: kept only when it is the app's own, relative to the app. */
function scrubFile(file: string, context: ErrorScrubbingContext): string {
  if (file === 'native' || file === '<anonymous>' || file.startsWith('node:'))
    return file;

  const devServer = /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?\/(.*)$/.exec(file);
  if (devServer)
    return devServer[1];

  const normalized = file.replace(/\\/g, '/');
  const asarIndex = normalized.indexOf('app.asar/');
  if (asarIndex >= 0)
    return normalized.slice(asarIndex);

  for (const appPath of context.appPaths) {
    const normalizedAppPath = appPath.replace(/\\/g, '/').replace(/\/$/, '');
    const index = normalizedAppPath ? normalized.indexOf(`${normalizedAppPath}/`) : -1;
    if (index >= 0)
      return normalized.slice(index + normalizedAppPath.length + 1);
  }

  return '<path>';
}

/**
 * A web address's origin, which tells which server, without its path and query, which can hold anything; nor the user
 * name, which the name of a computer on the network can hold ("http://<user>-macbook.local:8080/<path>"). A URL gives
 * its host in lower case, so the user name is matched in any case.
 */
function webOrigin(url: string, context: ErrorScrubbingContext): string | undefined {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return undefined;
  }
  if (!/^https?:$/.test(parsed.protocol))
    return undefined;
  let origin = parsed.origin;
  const names = context.sensitiveStrings
    .filter(s => s && s.length >= 3 && !/[\\/]/.test(s))
    .sort((a, b) => b.length - a.length);
  for (const name of names)
    origin = origin.replace(new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '<user>');
  return `${origin}/<path>`;
}

/**
 * A console message as scrubMessage gives it, but that a web address keeps its origin
 * ("https://tile.example.org/<path>"), so that a request that failed tells which server.
 */
export function scrubConsoleMessage(message: string, context: ErrorScrubbingContext): string {
  const origins: string[] = [];
  const marked = message.replace(/\bhttps?:\/\/[^\s'"`()<>]+/gi, url => {
    const origin = webOrigin(url, context);
    if (origin === undefined)
      return url;
    origins.push(origin);
    return `\u0000${origins.length - 1}\u0000`;
  });
  return scrubMessage(marked, context).replace(/\u0000(\d+)\u0000/g, (_match, index: string) => origins[Number(index)]);
}

/**
 * The source of a console message: a web address by its origin, whatever it serves, as its path and query can hold
 * anything, the dev server's included; else a file of the app's by its name, without a query, or <path>.
 */
export function scrubConsoleSource(sourceId: string, context: ErrorScrubbingContext): string {
  if (!sourceId)
    return '';
  const origin = webOrigin(sourceId, context);
  if (origin !== undefined)
    return origin;
  let file = sourceId.replace(/[?#][\s\S]*$/, '');
  try {
    file = decodeURI(file);
  } catch {
    // Kept as it is.
  }
  return scrubFile(file, context);
}

function replaceSensitiveStrings(text: string, context: ErrorScrubbingContext): string {
  // Longest first, so that the home folder is replaced before the user name inside it. A folder becomes "~", so
  // that the path it starts is then removed as a whole; anything else becomes "<user>".
  const sensitiveStrings = [...context.sensitiveStrings]
    .filter(s => s && s.length >= 3)
    .sort((a, b) => b.length - a.length);
  let result = text;
  for (const s of sensitiveStrings)
    result = result.split(s).join(/[\\/]/.test(s) ? '~' : '<user>');
  return result;
}

interface Thrown {
  readonly name: string;
  /** Scrubbed. */
  readonly message: string;
  /** Not scrubbed yet. */
  readonly stack?: string;
}

/**
 * Something with a message, as an error sent from another process or a worker is: it is described as an error. An
 * ErrorEvent is one too, its constructor's name its name.
 */
function isErrorLike(value: unknown): value is { name?: unknown, message: string, stack?: unknown } {
  return typeof value === 'object' && value !== null && typeof (value as { message?: unknown }).message === 'string';
}

function constructorName(value: object): string {
  const name = (value as { constructor?: { name?: unknown } }).constructor?.name;
  return typeof name === 'string' && name ? name : 'Object';
}

/** The fields of a thrown object whose text is kept when it is a code, such as "ENOENT" or "killed". */
const diagnosticFields: readonly string[] = ['code', 'syscall', 'type', 'reason', 'status', 'kind'];

/**
 * An object as JSON, with its numbers, booleans and null, and the texts of its diagnostic fields that are codes: any
 * other text could be a name of the user's or a token, and an object can hold anything.
 */
function objectText(value: object): string {
  try {
    return JSON.stringify(value, (key, field: unknown) =>
      typeof field === 'string' && !(diagnosticFields.includes(key) && /^[A-Za-z][A-Za-z0-9_:-]{0,39}$/.test(field)) ? '<value>' : field) ?? '';
  } catch {
    return `[object ${constructorName(value)}]`;  // A cycle, or a BigInt.
  }
}

/** What was thrown, as a name and a scrubbed message, with its stack when it has one. */
function describeThrown(thrown: unknown, context: ErrorScrubbingContext): Thrown {
  if (thrown instanceof Error)
    return { name: thrown.name, message: scrubMessage(thrown.message, context), stack: thrown.stack };
  if (isErrorLike(thrown)) {
    const name = typeof thrown.name === 'string' && thrown.name ? thrown.name : constructorName(thrown);
    return { name, message: scrubMessage(thrown.message, context), stack: typeof thrown.stack === 'string' ? thrown.stack : undefined };
  }
  if (typeof thrown === 'object' && thrown !== null)
    return { name: constructorName(thrown), message: scrubMessage(objectText(thrown), context) };
  return { name: typeof thrown, message: scrubMessage(String(thrown), context) };
}

/** The cause of an error, given with `new Error(message, { cause })`, or undefined. */
function causeOf(thrown: unknown): unknown {
  return typeof thrown === 'object' && thrown !== null && 'cause' in thrown ? (thrown as { cause: unknown }).cause : undefined;
}

/** The errors that an AggregateError, such as Promise.any's, holds. */
function aggregatedErrors(thrown: unknown): unknown[] {
  const errors = thrown instanceof Error ? (thrown as { errors?: unknown }).errors : undefined;
  return Array.isArray(errors) ? errors : [];
}

/** The frames of an error, then each of its causes with their frames, then the first errors of an AggregateError. */
function valueOf(thrown: unknown, first: Thrown, context: ErrorScrubbingContext): string {
  const parts: string[] = [];
  const add = (heading: string, described: Thrown) => {
    parts.push(`${heading}${described.name}: ${described.message}`.slice(0, maxLabelLength));
    if (described.stack)
      parts.push(scrubStack(described.stack, context));
  };

  if (first.stack)
    parts.push(scrubStack(first.stack, context));
  let cause = causeOf(thrown);
  for (let depth = 0; depth < maxCauses && cause !== undefined; depth++) {
    add('Caused by: ', describeThrown(cause, context));
    cause = causeOf(cause);
  }
  const errors = aggregatedErrors(thrown);
  errors.slice(0, maxAggregatedErrors).forEach((error, index) =>
    add(`Error ${index + 1} of ${errors.length}: `, describeThrown(error, context)));

  return parts.filter(Boolean).join('\n').slice(0, maxValueLength);
}

export function errorForAnalytics(error: unknown, context: ErrorScrubbingContext): { label: string, value: string } {
  const thrown = describeThrown(error, context);
  const label = `${thrown.name}: ${thrown.message}`.slice(0, maxLabelLength);
  return { label, value: valueOf(error, thrown, context) };
}
