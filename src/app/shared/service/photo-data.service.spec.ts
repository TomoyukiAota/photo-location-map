import { TestBed } from '@angular/core/testing';

import { PhotoDataService } from './photo-data.service';

describe('PhotoDataService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: PhotoDataService = TestBed.inject(PhotoDataService);
    expect(service).toBeTruthy();
  });

  it('publishes the photos of the folder in photos() once it is read', async () => {
    const service = TestBed.inject(PhotoDataService);
    expect(service.photos()).toEqual([]);

    await service.update({
      path: '/photos', name: 'photos', type: 'directory', children: [
        { path: '/photos/a.jpg', name: 'a.jpg', type: 'file', extension: '.jpg' },
        { path: '/photos/notes.txt', name: 'notes.txt', type: 'file', extension: '.txt' },
      ],
    } as DirectoryTree);

    expect(service.photos().map(photo => photo.path)).toEqual(['/photos/a.jpg']);
    expect(service.getAllPhotos().map(photo => photo.path)).toEqual(['/photos/a.jpg']);
  });
});
