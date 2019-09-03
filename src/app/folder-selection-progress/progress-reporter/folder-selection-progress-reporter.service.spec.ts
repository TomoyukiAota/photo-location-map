import { TestBed } from '@angular/core/testing';

import { FolderSelectionProgressReporterService } from './folder-selection-progress-reporter.service';

describe('FolderSelectionProgressReporterService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: FolderSelectionProgressReporterService = TestBed.get(FolderSelectionProgressReporterService);
    expect(service).toBeTruthy();
  });
});
