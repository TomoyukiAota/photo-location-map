import { TestBed } from '@angular/core/testing';

import { SettingsChangedService } from './settings-changed.service';

describe('SettingsChangedService', () => {
  let service: SettingsChangedService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SettingsChangedService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
