import { Injectable } from '@angular/core';
import { Logger } from '../../../src-shared/log/logger';
import { Photo } from './photo.model';

@Injectable({
  providedIn: 'root'
})
export class SelectedPhotoService {
  private selectedPhotos: Photo[];

  public update(selectedPaths: string[]) {
    const selectedPhotos = selectedPaths.map(path => {
      // TODO: This path-photo mapping routine will be replaced with asking PhotoDataService with path which returns Photo.
      const photo = new Photo();
      photo.name = 'temp';
      photo.path = path;
      return photo;
    });
    Logger.info('Selected Photos: ', selectedPhotos);
    this.selectedPhotos = selectedPhotos;
  }
}
