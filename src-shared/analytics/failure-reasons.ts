import { Analytics } from './analytics';
import { scrubbedErrorLabel, scrubbedErrorText } from './record-error';

/** How many reasons one batch records: the most frequent. */
export const maxRecordedReasons = 5;

export interface FailureReason {
  /** The status, and what was thrown without paths, such as "failed-in-heic-convert: Error: …". */
  readonly reason: string;
  /** How many files failed for it. */
  readonly files: number;
}

/**
 * Why the files of one batch failed, counted by reason, so that it can be recorded: one event per reason, with the
 * reason as its label and how many files failed for it as its value. The same reason for many files is one reason,
 * counted. The thumbnails of a generation (src-main/thumbnail-generation/thumbnail-failures.ts) and the photos of an
 * opened folder whose EXIF data could not be read (src/app/shared/exif-fetcher/exif-read-failures.ts) are such.
 */
export class FailureReasons {
  private readonly files = new Map<string, number>();

  constructor(private readonly category: string, private readonly action: string) {
  }

  /** @param error What was thrown, as an error or as the text another process sent; it may contain paths. */
  public add(status: string, error?: unknown): void {
    const text = error === undefined || error === null || error === ''
      ? ''
      : typeof error === 'string' ? scrubbedErrorText(error) : scrubbedErrorLabel(error);
    const reason = text ? `${status}: ${text}` : status;
    this.files.set(reason, (this.files.get(reason) ?? 0) + 1);
  }

  /** The reasons, the most frequent first, at most maxRecordedReasons of them. */
  public get reasons(): FailureReason[] {
    return [...this.files]
      .map(([reason, files]) => ({ reason, files }))
      .sort((a, b) => b.files - a.files || a.reason.localeCompare(b.reason))
      .slice(0, maxRecordedReasons);
  }

  /** One event per reason: the reason as the label, and how many files failed for it as the value. */
  public record(): void {
    for (const { reason, files } of this.reasons)
      Analytics.trackEvent(this.category, this.action, reason, `Files: ${files}`);
  }

  /** Forgets the reasons, for the next batch. */
  public clear(): void {
    this.files.clear();
  }
}
