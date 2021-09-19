import { TestBed } from '@angular/core/testing';

import { LoadedFilesStatusBarService } from './loaded-files-status-bar.service';

describe('LoadedFilesStatusBarService', () => {
  let service: LoadedFilesStatusBarService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoadedFilesStatusBarService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
