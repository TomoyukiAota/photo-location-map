import { Injectable } from '@angular/core';
import { Logger } from '../../../src-shared/log/logger';
import { Photo } from './photo.model';
import { PhotoDataService } from './photo-data.service';

@Injectable({
  providedIn: 'root'
})
export class SelectedPhotoService {
  private selectedPhotos: Photo[];

  constructor(private photoDataService: PhotoDataService) {
  }

  public update(selectedPaths: string[]) {
    const selectedPhotos = selectedPaths.map(path => this.photoDataService.getPhoto(path));
    Logger.info('Selected Photos: ', selectedPhotos);
    this.selectedPhotos = selectedPhotos;
  }
}
