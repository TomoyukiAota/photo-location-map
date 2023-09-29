import { Injectable } from '@angular/core';
import * as _ from 'lodash';
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

  public setSelectedPhotos(desiredSelectedPhotos: Photo[]) {
    const desiredSelectedPhotoPaths = desiredSelectedPhotos.map(photo => photo.path);
    const currentSelectedPhotoPaths = this.getSelectedPhotos().map(photo => photo.path);
    const isDesiredSameAsCurrent = _.isEqual(desiredSelectedPhotoPaths.sort(), currentSelectedPhotoPaths.sort());
    if (isDesiredSameAsCurrent) { return; } // If same, skip updating selected photos to avoid adding selection history. e.g. Avoid adding history when repeating "Select Only This".

    this.selectedPhotos.next(desiredSelectedPhotos);
    this.photoSelectionHistoryService.add(desiredSelectedPhotos);
    Logger.info('Selected Photos: ', desiredSelectedPhotos);
  }

  public getSelectedPhotos(): Photo[] {
    return Array.from(this.selectedPhotos.getValue());
  }
}
