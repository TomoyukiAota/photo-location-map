import { TestBed } from '@angular/core/testing';

import { LeafletMapForceRenderService } from './leaflet-map-force-render.service';

describe('LeafletMapForceRenderService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: LeafletMapForceRenderService = TestBed.inject(LeafletMapForceRenderService);
    expect(service).toBeTruthy();
  });
});
