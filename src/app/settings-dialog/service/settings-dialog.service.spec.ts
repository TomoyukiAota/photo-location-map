import { TestBed } from '@angular/core/testing';

import { SettingsDialogService } from './settings-dialog.service';

describe('SettingsDialogService', () => {
  let service: SettingsDialogService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SettingsDialogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
