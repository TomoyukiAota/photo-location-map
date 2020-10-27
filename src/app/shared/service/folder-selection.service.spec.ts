import { TestBed } from '@angular/core/testing';

import { FolderSelectionService } from './folder-selection.service';

describe('FolderSelectionService', () => {
  let service: FolderSelectionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FolderSelectionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
