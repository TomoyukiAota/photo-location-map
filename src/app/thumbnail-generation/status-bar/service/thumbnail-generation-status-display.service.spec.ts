import { TestBed } from '@angular/core/testing';

import { ThumbnailGenerationStatusBarService } from './thumbnail-generation-status-bar.service';

describe('ThumbnailGenerationStatusBarService', () => {
  let service: ThumbnailGenerationStatusBarService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThumbnailGenerationStatusBarService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
