import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Logger } from '../../../../src-shared/log/logger';
import { Photo } from '../model/photo.model';
import { PhotoSelectionHistoryService } from './photo-selection-history.service';

@Injectable({
  providedIn: 'root'
})
export class SelectedPhotoService {
  public selectedPhotos = new BehaviorSubject<Photo[]>([]);    // Represents the photos selected in the directory tree view

  constructor(private photoSelectionHistoryService: PhotoSelectionHistoryService) {
  }

  public setSelectedPhotos(selectedPhotos: Photo[]) {
    this.selectedPhotos.next(selectedPhotos);
    this.photoSelectionHistoryService.add(selectedPhotos);
    Logger.info('Selected Photos: ', selectedPhotos);
  }

  public getSelectedPhotos(): Photo[] {
    return Array.from(this.selectedPhotos.getValue());
  }
}
