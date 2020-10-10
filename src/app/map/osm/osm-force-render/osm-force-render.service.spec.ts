import { TestBed } from '@angular/core/testing';

import { OsmForceRenderService } from './osm-force-render.service';

describe('OsmForceRenderService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: OsmForceRenderService = TestBed.inject(OsmForceRenderService);
    expect(service).toBeTruthy();
  });
});
