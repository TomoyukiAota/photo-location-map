import { signal, inject, Service } from '@angular/core';
import isEqual from 'lodash-es/isEqual.js';
import { Logger } from '../../../../src-shared/log/logger';
import { Photo } from '../model/photo.model';
import { PhotoSelectionHistoryService } from './photo-selection-history.service';

@Service()
export class SelectedPhotoService {
  private photoSelectionHistoryService = inject(PhotoSelectionHistoryService);

  private readonly selectedPhotosState = signal<readonly Photo[]>([]);
  /** The photos selected in the directory tree view. */
  public readonly selectedPhotos = this.selectedPhotosState.asReadonly();

  /** Selects the photos and adds them to the selection history, unless the same paths are selected already. */
  public setSelectedPhotos(desiredSelectedPhotos: Photo[]) {
    const desiredSelectedPhotoPaths = desiredSelectedPhotos.map(photo => photo.path);
    const currentSelectedPhotoPaths = this.getSelectedPhotos().map(photo => photo.path);
    const isDesiredSameAsCurrent = isEqual(desiredSelectedPhotoPaths.sort(), currentSelectedPhotoPaths.sort());
    if (isDesiredSameAsCurrent) { return; } // If same, avoid adding selection history. e.g. Avoid adding history when repeating "Select Only This" for the same photo(s).

    this.selectedPhotosState.set(desiredSelectedPhotos);
    this.photoSelectionHistoryService.add(desiredSelectedPhotos);
    // How many, not the photos: the file got the text alone, while the console got the photos, of which V8 made a
    // string at each change of the selection (160,042 characters for 10,000 photos), sent to the main process.
    Logger.info(`Selected Photos: ${desiredSelectedPhotos.length}`);
  }

  public getSelectedPhotos(): Photo[] {
    return Array.from(this.selectedPhotos());
  }
}
