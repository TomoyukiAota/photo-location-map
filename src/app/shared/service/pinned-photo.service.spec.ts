import { TestBed } from '@angular/core/testing';
import { Photo } from '../model/photo.model';
import { PinnedPhotoService } from './pinned-photo.service';

function photo(path: string): Photo {
  return Object.assign(new Photo(), { name: path.slice(path.lastIndexOf('/') + 1), path, filenameExtension: '.jpg', exif: null });
}

describe('PinnedPhotoService', () => {
  let service: PinnedPhotoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PinnedPhotoService);
  });

  it('pins the photos it is given, and gives a copy of them', () => {
    const photos = [photo('/photos/a.jpg'), photo('/photos/b.jpg')];
    service.setPinnedPhotos(photos);

    expect(service.pinnedPhotos()).toEqual(photos);
    const copy = service.getPinnedPhotos();
    copy.pop();
    expect(service.pinnedPhotos()).toHaveLength(2);
  });

  it('keeps the photos it has when the same paths are pinned again, in any order', () => {
    service.setPinnedPhotos([photo('/photos/a.jpg'), photo('/photos/b.jpg')]);
    const pinned = service.pinnedPhotos();

    service.setPinnedPhotos([photo('/photos/b.jpg'), photo('/photos/a.jpg')]);

    // Same array, so the maps, which render again on every change, are not asked to.
    expect(service.pinnedPhotos()).toBe(pinned);
  });
});
