import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Logger } from '../../../../src-shared/log/logger';
import { Photo } from '../model/photo.model';
import { PhotoSelectionHistoryService } from './photo-selection-history.service';
import { PinnedPhotoService } from './pinned-photo.service';

@Injectable({
  providedIn: 'root'
})
export class SelectedPhotoService {
  constructor(private photoSelectionHistoryService: PhotoSelectionHistoryService,
              private pinnedPhotoService: PinnedPhotoService) {
  }

  public setSelectedPhotos(selectedPhotos: Photo[]) {
    this.photoSelectionHistoryService.add(selectedPhotos);
    Logger.info('Selected Photos: ', selectedPhotos);
    this.pinnedPhotoService.setPinnedPhotos(selectedPhotos);
  }
}
