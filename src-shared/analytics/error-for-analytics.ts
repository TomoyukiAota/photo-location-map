// Turns an error into an event label and value without any of the user's file paths, which can contain their
// name or the names of their folders and photos.
//  - The message keeps its words; anything that looks like a path becomes "<path>", including anything under
//    the user's home folder, and the user name becomes "<user>".
//  - The stack keeps its first few frames: function names, and file names only when the file is inside the
//    app (the app.asar bundle, the app's own folder, or the page served by the dev server); every other file
//    location becomes "<path>".

export interface ErrorScrubbingContext {
  /** Folders of the app itself, whose files may be named in stacks (e.g. app.getAppPath()). */
  readonly appPaths: readonly string[];
  /** Strings that must not be sent, such as the home folder and the user name. */
  readonly sensitiveStrings: readonly string[];
}

export const maxLabelLength = 1000;
export const maxStackFrames = 5;

export function scrubMessage(message: string, context: ErrorScrubbingContext): string {
  let result = replaceSensitiveStrings(message, context);
  // Quoted text with a path separator in it, such as ENOENT's "open '/Users/x/Pictures/a b.jpg'".
  result = result.replace(/(['"`])[^'"`]*[\\/][^'"`]*\1/g, (_match, quote: string) => `${quote}<path>${quote}`);
  // Anything else with a path separator, such as an unquoted path or URL.
  result = result.replace(/[^\s'"`()<>,;]*[\\/][^\s'"`()<>,;]*/g, token => token === '/' ? token : '<path>');
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

  if (file === 'native' || file === '<anonymous>' || file.startsWith('node:'))
    return location;

  const devServer = /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?\/(.*)$/.exec(file);
  if (devServer)
    return `${devServer[1]}${lineAndColumn}`;

  const normalized = file.replace(/\\/g, '/');
  const asarIndex = normalized.indexOf('app.asar/');
  if (asarIndex >= 0)
    return `${normalized.slice(asarIndex)}${lineAndColumn}`;

  for (const appPath of context.appPaths) {
    const normalizedAppPath = appPath.replace(/\\/g, '/').replace(/\/$/, '');
    const index = normalizedAppPath ? normalized.indexOf(`${normalizedAppPath}/`) : -1;
    if (index >= 0)
      return `${normalized.slice(index + normalizedAppPath.length + 1)}${lineAndColumn}`;
  }

  return `<path>${lineAndColumn}`;
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

export function errorForAnalytics(error: unknown, context: ErrorScrubbingContext): { label: string, value: string } {
  const name = error instanceof Error ? error.name : typeof error;
  const message = error instanceof Error ? error.message : String(error);
  const label = `${name}: ${scrubMessage(message, context)}`.slice(0, maxLabelLength);
  const value = error instanceof Error && error.stack ? scrubStack(error.stack, context) : '';
  return { label, value };
}
