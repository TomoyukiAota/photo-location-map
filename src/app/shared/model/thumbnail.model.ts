import { Dimensions } from './dimensions.model';

export class Thumbnail {
  constructor(public readonly dataUrl: string,
              public readonly dimensions: Dimensions) {
  }
}
