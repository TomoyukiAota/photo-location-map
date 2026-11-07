import { TestBed } from '@angular/core/testing';

import { ThumbnailGenerationStatusBarService } from './thumbnail-generation-status-bar.service';

describe('ThumbnailGenerationStatusBarService', () => {
  let service: ThumbnailGenerationStatusBarService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThumbnailGenerationStatusBarService);
  });

  it('is hidden until a generation starts', () => {
    expect(service.visible()).toBe(false);
    expect(service.detailsVisible()).toBe(false);
  });

  it('shows each new generation with its details closed, until it is hidden', () => {
    service.showForNewGeneration();
    expect(service.visible()).toBe(true);
    service.toggleDetails();
    expect(service.detailsVisible()).toBe(true);

    service.hide();
    expect(service.visible()).toBe(false);

    service.showForNewGeneration();
    expect(service.visible()).toBe(true);
    expect(service.detailsVisible()).toBe(false);
  });
});
