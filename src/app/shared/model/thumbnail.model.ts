import { Dimensions } from './dimensions.model';

export class Thumbnail {
  constructor(public readonly objectUrl: string,
              public readonly dimensions: Dimensions) {
  }
}
