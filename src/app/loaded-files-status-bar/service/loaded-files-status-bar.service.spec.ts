import { TestBed } from '@angular/core/testing';
import { currentUserSettings } from '../../../../src-shared/user-settings/user-settings';
import { LoadedFilesStatusBarService } from './loaded-files-status-bar.service';

describe('LoadedFilesStatusBarService', () => {
  const savedShowStatusBar = currentUserSettings.showStatusBar;

  beforeEach(() => TestBed.configureTestingModule({}));
  afterEach(() => currentUserSettings.showStatusBar = savedShowStatusBar);

  it('starts from the Show Status Bar setting', () => {
    currentUserSettings.showStatusBar = 'false';

    expect(TestBed.inject(LoadedFilesStatusBarService).visible()).toBe(false);
  });

  it('shows the value being tried, and the setting again when restored', () => {
    currentUserSettings.showStatusBar = 'true';
    const service = TestBed.inject(LoadedFilesStatusBarService);
    expect(service.visible()).toBe(true);

    service.setVisibility(false);
    expect(service.visible()).toBe(false);

    service.restoreVisibilityToSettingValue();
    expect(service.visible()).toBe(true);
  });
});
