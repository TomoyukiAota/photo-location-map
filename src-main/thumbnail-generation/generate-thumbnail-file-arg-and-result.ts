export class ThumbnailFileGenerationArgs {
  public srcFilePath: string;
  public outputFileDir: string;
  public outputFilePath: string;
}

export type ThumbnailFileGenerationResultStatus =
  'null-args' | 'failed-to-read-src-file' | 'failed-to-write-thumbnail-file' | 'success';


export class ThumbnailFileGenerationResult {
  constructor(public status: ThumbnailFileGenerationResultStatus) {}
}
