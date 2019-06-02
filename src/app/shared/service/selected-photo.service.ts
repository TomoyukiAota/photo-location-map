import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Logger } from '../../../../src-shared/log/logger';
import { Photo } from '../model/photo.model';
import { PhotoDataService } from './photo-data.service';

@Injectable({
  providedIn: 'root'
})
export class SelectedPhotoService {
  public selectedPhotosChanged = new Subject<Photo[]>();

  constructor(private photoDataService: PhotoDataService) {
  }

  public update(selectedPaths: string[]) {
    const selectedPhotos = selectedPaths.map(path => this.photoDataService.getPhoto(path));
    Logger.info('Selected Photos: ', selectedPhotos);
    this.selectedPhotosChanged.next(selectedPhotos);
  }
}
