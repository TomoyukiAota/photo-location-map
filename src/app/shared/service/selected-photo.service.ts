import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Logger } from '../../../../src-shared/log/logger';
import { Photo } from '../model/photo.model';
import { PhotoDataService } from './photo-data.service';

@Injectable({
  providedIn: 'root'
})
export class SelectedPhotoService {
  private selectedPhotos: Photo[] = [];
  public selectedPhotosChanged = new Subject<Photo[]>();

  constructor(private photoDataService: PhotoDataService) {
  }

  public update(selectedPaths: string[]) {
    const selectedPhotos = selectedPaths.map(path => this.photoDataService.getPhoto(path));
    this.selectedPhotosChanged.next(selectedPhotos);
    this.selectedPhotos = selectedPhotos;
    Logger.info('Selected Photos: ', selectedPhotos);
  }

  public getSelectedPhotos(): Photo[] {
    const selectedPhotosClone = Array.from(this.selectedPhotos);
    return selectedPhotosClone;
  }
}
