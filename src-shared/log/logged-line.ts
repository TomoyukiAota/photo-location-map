// TL;DR: A line of the log that knows what of it may be recorded for analytics.
// Details: Logger.error and Logger.warn record their lines (src-shared/analytics/record-logged-line.ts), and a line
// often holds a path or a file's name, which no scrubbing can tell by its form: a folder's name with spaces, a file's
// name without a separator. So the line says it where it is written:
//
//   Logger.error(logged`Failed to add the marker of ${photo.path}`, error);
//
// The console and the log file get the whole line. The line is recorded with each value as "<value>", unless the
// value is a number or a boolean, an error (its name and message, which recording scrubs of paths), or wrapped in
// shown() by the caller, because it cannot name anything of the user's.

/** A value of a logged line that is recorded as it is (shown()). */
export class ShownValue {
  constructor(public readonly value: unknown) {
  }

  public toString(): string {
    return String(this.value);
  }
}

/**
 * Marks a value of a logged line that cannot name anything of the user's, such as a window's name, a platform, a
 * reason, a status or an IPC channel, so that it is recorded as it is. When unsure, do not mark it.
 */
export function shown(value: unknown): ShownValue {
  return new ShownValue(value);
}

/** A value as it is recorded: see the comment at the top. */
function recordedValue(value: unknown): string {
  if (value instanceof ShownValue)
    return String(value.value);
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint')
    return String(value);
  if (value instanceof Error)
    return `${value.name}: ${value.message}`;
  return '<value>';
}

/** A line of the log, made by `logged`, with its text and what of it is recorded. */
export class LoggedLine {
  constructor(private readonly strings: readonly string[], private readonly values: readonly unknown[]) {
  }

  /** The whole line, as the console and the log file have it. */
  public toString(): string {
    return this.join(value => String(value));
  }

  /** The line as it is recorded, before recording scrubs it of paths: each value that is not shown as "<value>". */
  public get recorded(): string {
    return this.join(recordedValue);
  }

  /** The same line after a text that is the code's own, such as a logger's prefix. */
  public prefixed(prefix: string): LoggedLine {
    const [first = '', ...rest] = this.strings;
    return new LoggedLine([`${prefix}${first}`, ...rest], this.values);
  }

  private join(valueText: (value: unknown) => string): string {
    return this.strings.reduce((line, text, index) => index === 0 ? text : `${line}${valueText(this.values[index - 1])}${text}`, '');
  }
}

/** The tag of a line with values: see the comment at the top. */
export function logged(strings: TemplateStringsArray, ...values: unknown[]): LoggedLine {
  return new LoggedLine([...strings], values);
}
