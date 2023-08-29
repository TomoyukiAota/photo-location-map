import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Photo } from '../model/photo.model';

@Injectable({
  providedIn: 'root'
})
export class PinnedPhotoService {
  public pinnedPhotos = new BehaviorSubject<Photo[]>([]);    // Represents the photos pinned on the map

  public setPinnedPhotos(pinnedPhotos: Photo[]) {
    this.pinnedPhotos.next(pinnedPhotos);
  }

  public getPinnedPhotos(): Photo[] {
    return Array.from(this.pinnedPhotos.getValue());
  }
}
