import { TestBed } from '@angular/core/testing';

import { ThumbnailGenerationStatusDisplayService } from './thumbnail-generation-status-display.service';

describe('ThumbnailGenerationStatusDisplayService', () => {
  let service: ThumbnailGenerationStatusDisplayService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThumbnailGenerationStatusDisplayService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
