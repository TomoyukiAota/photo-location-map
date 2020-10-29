import { TestBed } from '@angular/core/testing';

import { SettingDialogService } from './setting-dialog.service';

describe('SettingDialogService', () => {
  let service: SettingDialogService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SettingDialogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
