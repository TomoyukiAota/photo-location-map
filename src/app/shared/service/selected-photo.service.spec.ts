import { TestBed } from '@angular/core/testing';
import { Logger } from '../../../../src-shared/log/logger';
import { Photo } from '../model/photo.model';
import { PhotoSelectionHistoryService } from './photo-selection-history.service';
import { SelectedPhotoService } from './selected-photo.service';

function photo(path: string): Photo {
  return Object.assign(new Photo(), { name: path.slice(path.lastIndexOf('/') + 1), path, filenameExtension: '.jpg', exif: null });
}

describe('SelectedPhotoService', () => {
  const add = vi.fn();
  let service: SelectedPhotoService;

  beforeEach(() => {
    add.mockClear();
    TestBed.configureTestingModule({ providers: [{ provide: PhotoSelectionHistoryService, useValue: { add } }] });
    service = TestBed.inject(SelectedPhotoService);
  });

  it('selects the photos it is given, adds them to the history, and gives a copy of them', () => {
    const photos = [photo('/photos/a.jpg'), photo('/photos/b.jpg')];
    service.setSelectedPhotos(photos);

    expect(service.selectedPhotos()).toEqual(photos);
    expect(add).toHaveBeenCalledWith(photos);
    const copy = service.getSelectedPhotos();
    copy.pop();
    expect(service.selectedPhotos()).toHaveLength(2);
  });

  it('keeps its selection, and its history, when the same paths are selected again in any order', () => {
    service.setSelectedPhotos([photo('/photos/a.jpg'), photo('/photos/b.jpg')]);
    const selected = service.selectedPhotos();

    service.setSelectedPhotos([photo('/photos/b.jpg'), photo('/photos/a.jpg')]);

    expect(service.selectedPhotos()).toBe(selected);
    expect(add).toHaveBeenCalledTimes(1);
  });

  it('logs how many photos are selected, not the photos', () => {
    const info = vi.spyOn(Logger, 'info').mockImplementation(() => undefined);
    try {
      service.setSelectedPhotos([photo('/photos/a.jpg'), photo('/photos/b.jpg')]);

      expect(info).toHaveBeenCalledExactlyOnceWith('Selected Photos: 2');
    } finally {
      info.mockRestore();
    }
  });
});
