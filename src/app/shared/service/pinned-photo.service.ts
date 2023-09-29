import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { BehaviorSubject } from 'rxjs';
import { Photo } from '../model/photo.model';

@Injectable({
  providedIn: 'root'
})
export class PinnedPhotoService {
  public pinnedPhotos = new BehaviorSubject<Photo[]>([]);    // Represents the photos pinned on the map

  public setPinnedPhotos(desiredPinnedPhotos: Photo[]) {
    const desiredPinnedPhotoPaths = desiredPinnedPhotos.map(photo => photo.path);
    const currentPinnedPhotoPaths = this.getPinnedPhotos().map(photo => photo.path);
    const isDesiredSameAsCurrent = _.isEqual(desiredPinnedPhotoPaths.sort(), currentPinnedPhotoPaths.sort());
    if (isDesiredSameAsCurrent) { return; } // If same, skip updating pinned photos to avoid 1) resetting the map for usability and 2) consuming the quota of the map.
    
    this.pinnedPhotos.next(desiredPinnedPhotos);
  }

  public getPinnedPhotos(): Photo[] {
    return Array.from(this.pinnedPhotos.getValue());
  }
}
