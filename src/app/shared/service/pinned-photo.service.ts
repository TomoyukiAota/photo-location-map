import { Injectable, signal } from '@angular/core';
import * as _ from 'lodash';
import { Photo } from '../model/photo.model';

@Injectable({
  providedIn: 'root'
})
export class PinnedPhotoService {
  private readonly pinnedPhotosState = signal<readonly Photo[]>([]);
  /** The photos pinned on the map. */
  public readonly pinnedPhotos = this.pinnedPhotosState.asReadonly();

  public setPinnedPhotos(desiredPinnedPhotos: Photo[]) {
    const desiredPinnedPhotoPaths = desiredPinnedPhotos.map(photo => photo.path);
    const currentPinnedPhotoPaths = this.getPinnedPhotos().map(photo => photo.path);
    const isDesiredSameAsCurrent = _.isEqual(desiredPinnedPhotoPaths.sort(), currentPinnedPhotoPaths.sort());
    if (isDesiredSameAsCurrent) { return; } // If same, skip updating pinned photos to avoid 1) resetting the map for usability and 2) consuming the quota of the map.

    this.pinnedPhotosState.set(desiredPinnedPhotos);
  }

  public getPinnedPhotos(): Photo[] {
    return Array.from(this.pinnedPhotos());
  }
}
