import { TestBed } from '@angular/core/testing';
import { ThumbnailRotationService } from './thumbnail-rotation.service';

describe('ThumbnailRotationService', () => {
  let service: ThumbnailRotationService;

  beforeEach(() => {
    service = TestBed.inject(ThumbnailRotationService);
  });

  it('turns a thumbnail by a quarter more for each turn', () => {
    expect(service.degreesOf('leaflet-map-popup', '/photos/a.jpg')).toBe(0);
    service.rotate('leaflet-map-popup', '/photos/a.jpg');
    expect(service.degreesOf('leaflet-map-popup', '/photos/a.jpg')).toBe(90);
    for (let turn = 0; turn < 4; turn++)
      service.rotate('leaflet-map-popup', '/photos/a.jpg');
    // Past a full turn, so that the thumbnail goes on turning clockwise rather than back.
    expect(service.degreesOf('leaflet-map-popup', '/photos/a.jpg')).toBe(450);
  });

  it('turns the thumbnail of one photo in one place only', () => {
    service.rotate('dir-tree-view', '/photos/a.jpg');

    expect(service.degreesOf('dir-tree-view', '/photos/a.jpg')).toBe(90);
    expect(service.degreesOf('leaflet-map-popup', '/photos/a.jpg')).toBe(0);
    expect(service.degreesOf('leaflet-map-tile', '/photos/a.jpg')).toBe(0);
    expect(service.degreesOf('dir-tree-view', '/photos/b.jpg')).toBe(0);
  });

  it('turns every thumbnail back for the photos of another folder', () => {
    service.rotate('dir-tree-view', '/photos/a.jpg');
    service.rotate('leaflet-map-tile', '/photos/b.jpg');

    service.reset();

    expect(service.degreesOf('dir-tree-view', '/photos/a.jpg')).toBe(0);
    expect(service.degreesOf('leaflet-map-tile', '/photos/b.jpg')).toBe(0);
  });
});
