import { Service, signal } from '@angular/core';
import { PhotoInfoViewerPlace } from './photo-info-viewer-place';

/**
 * How far the thumbnail of each photo is turned, in each place that shows it.
 * TL;DR: Kept here, apart from the component that shows the thumbnail, so that a thumbnail stays turned while its
 * component is not there. Opening another folder turns every thumbnail back.
 * Details: A row of the tree is made again when its folder is expanded again or the tree is sorted, and the content
 * of a popup when the map is rendered again. Before the viewer was a component, each place kept the elements that it
 * had shown, turned as they were, until another folder was opened.
 */
@Service()
export class ThumbnailRotationService {
  private readonly degrees = signal<ReadonlyMap<string, number>>(new Map());

  /** How far the photo's thumbnail is turned in the place, in degrees clockwise: 0, and 90 more for each turn. */
  public degreesOf(place: PhotoInfoViewerPlace, photoPath: string): number {
    return this.degrees().get(keyOf(place, photoPath)) ?? 0;
  }

  /** Turns the photo's thumbnail in the place by a quarter, clockwise. */
  public rotate(place: PhotoInfoViewerPlace, photoPath: string): void {
    const key = keyOf(place, photoPath);
    this.degrees.update(degrees => new Map(degrees).set(key, (degrees.get(key) ?? 0) + 90));
  }

  /** Turns every thumbnail back, for the photos of another folder. */
  public reset(): void {
    this.degrees.set(new Map());
  }
}

/** A place has no colon in its name, so the key of a place and a path is that of no other pair. */
function keyOf(place: PhotoInfoViewerPlace, photoPath: string): string {
  return `${place}:${photoPath}`;
}
