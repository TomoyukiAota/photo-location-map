import { Dimensions } from './dimensions.model.js';

export class Thumbnail {
  constructor(public readonly objectUrl: string,
              public readonly dimensions: Dimensions) {
  }
}
