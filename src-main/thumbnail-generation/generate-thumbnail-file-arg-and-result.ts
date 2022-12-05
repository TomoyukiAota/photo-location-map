export class ThumbnailFileGenerationArg {
  public srcFilePath: string;
  public outputFileDir: string;
  public outputFilePath: string;
}

export type ThumbnailFileGenerationResultStatus =
  'null-arg' | 'failed-to-read-src-file' | 'failed-in-heic-convert' | 'failed-to-ensure-dir' |
  'failed-to-write-thumbnail-file' | 'success';


export class ThumbnailFileGenerationResult {
  constructor(public status: ThumbnailFileGenerationResultStatus) {}
}
