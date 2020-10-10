import { TestBed } from '@angular/core/testing';

import { PhotoDataService } from './photo-data.service';

describe('PhotoDataService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: PhotoDataService = TestBed.inject(PhotoDataService);
    expect(service).toBeTruthy();
  });
});
