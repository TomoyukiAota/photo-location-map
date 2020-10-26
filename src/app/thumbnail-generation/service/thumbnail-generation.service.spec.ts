import { TestBed } from '@angular/core/testing';

import { ThumbnailGenerationService } from './thumbnail-generation.service';

describe('ThumbnailGenerationService', () => {
  let service: ThumbnailGenerationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThumbnailGenerationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
