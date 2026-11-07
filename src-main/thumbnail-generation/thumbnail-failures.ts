import { Analytics } from '../../src-shared/analytics/analytics';
import { scrubbedErrorText } from '../../src-shared/analytics/record-error';

/** How many reasons one generation records: the most frequent. */
export const maxRecordedReasons = 5;

export interface ThumbnailFailureReason {
  /** The worker's status, and what was thrown without paths, such as "failed-in-heic-convert: Error: …". */
  readonly reason: string;
  /** How many files failed for it. */
  readonly files: number;
}

/**
 * Why the thumbnails of one generation could not be made, so that it can be recorded. "Thumbnail Generation
 * Finished" says only how many failed, and error reports from 1.12.1 show nearly every HEIF file of a folder failing
 * on some machines, which a count cannot explain. The same reason for many files is one reason, counted.
 */
export class ThumbnailFailures {
  private readonly files = new Map<string, number>();

  /** @param error What was thrown, as an error or as the text a worker process sent; it may contain paths. */
  public add(status: string, error?: unknown): void {
    const text = error === undefined || error === null || error === ''
      ? ''
      : scrubbedErrorText(typeof error === 'string' ? error : error instanceof Error ? `${error.name}: ${error.message}` : String(error));
    const reason = text ? `${status}: ${text}` : status;
    this.files.set(reason, (this.files.get(reason) ?? 0) + 1);
  }

  /** The reasons, the most frequent first, at most maxRecordedReasons of them. */
  public get reasons(): ThumbnailFailureReason[] {
    return [...this.files]
      .map(([reason, files]) => ({ reason, files }))
      .sort((a, b) => b.files - a.files || a.reason.localeCompare(b.reason))
      .slice(0, maxRecordedReasons);
  }

  /** One event per reason: the reason as the label, and how many files failed for it as the value. */
  public record(): void {
    for (const { reason, files } of this.reasons)
      Analytics.trackEvent('Thumbnail Generation', 'Thumbnail Generation Failed', reason, `Files: ${files}`);
  }
}
