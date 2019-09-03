import { TestBed } from '@angular/core/testing';

import { LoadingFolderProgressReporterService } from './loading-folder-progress-reporter.service';

describe('LoadingFolderProgressReporterService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: LoadingFolderProgressReporterService = TestBed.get(LoadingFolderProgressReporterService);
    expect(service).toBeTruthy();
  });
});
