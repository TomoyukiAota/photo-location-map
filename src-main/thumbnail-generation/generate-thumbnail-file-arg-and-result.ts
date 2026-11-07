export class ThumbnailFileGenerationArg {
  public srcFilePath: string;
  public outputFileDir: string;
  public outputFilePath: string;
}

export type ThumbnailFileGenerationResultStatus =
  'null-arg' | 'failed-to-read-src-file' | 'failed-in-heic-convert' | 'failed-to-ensure-dir' |
  'failed-to-write-thumbnail-file' | 'success';


export class ThumbnailFileGenerationResult {
  /**
   * @param error For a failure, what was thrown, as "Name: message". It can contain the photo's path; the main process
   *              takes paths out before recording it (ThumbnailFailures).
   */
  constructor(public status: ThumbnailFileGenerationResultStatus, public error?: string) {}
}

/** An error as "Name: message", to be sent from the worker process as text. */
export function describeThumbnailError(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}
