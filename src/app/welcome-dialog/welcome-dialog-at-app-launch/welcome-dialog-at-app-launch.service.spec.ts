import { TestBed } from '@angular/core/testing';

import { WelcomeDialogAtAppLaunchService } from './welcome-dialog-at-app-launch.service';

describe('WelcomeDialogAtAppLaunchService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: WelcomeDialogAtAppLaunchService = TestBed.inject(WelcomeDialogAtAppLaunchService);
    expect(service).toBeTruthy();
  });
});
