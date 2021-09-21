import { TestBed } from '@angular/core/testing';

import { RestoreSettingsService } from './restore-settings.service';

describe('RestoreSettingsService', () => {
  let service: RestoreSettingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RestoreSettingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
