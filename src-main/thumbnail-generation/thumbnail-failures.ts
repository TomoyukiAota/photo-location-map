import { FailureReason, FailureReasons } from '../../src-shared/analytics/failure-reasons.js';

export { maxRecordedReasons } from '../../src-shared/analytics/failure-reasons.js';

export type ThumbnailFailureReason = FailureReason;

/**
 * Why the thumbnails of one generation could not be made, so that it can be recorded as "Thumbnail Generation Failed".
 * "Thumbnail Generation Finished" says only how many failed, and error reports from 1.12.1 show nearly every HEIF file
 * of a folder failing on some machines, which a count cannot explain.
 */
export class ThumbnailFailures extends FailureReasons {
  constructor() {
    super('Thumbnail Generation', 'Thumbnail Generation Failed');
  }
}
