import { TestBed } from '@angular/core/testing';
import { Exif } from '../../shared/model/exif.model';
import { GpsInfo } from '../../shared/model/gps-info.model';
import { LatLng } from '../../shared/model/lat-lng.model';
import { Photo } from '../../shared/model/photo.model';
import { PinnedPhotoService } from '../../shared/service/pinned-photo.service';
import { GoogleMapsComponent } from './google-maps.component';

function photo(name: string, latitude: number, longitude: number): Photo {
  const gpsInfo = Object.assign(new GpsInfo(), { latLng: new LatLng(latitude, longitude) });
  return Object.assign(new Photo(), { name, path: `/photos/${name}`, filenameExtension: '.jpg', exif: Object.assign(new Exif(), { gpsInfo }) });
}

describe('GoogleMapsComponent', () => {
  // A stand-in for the Google Maps API, which counts the markers of each map created: each one uses the API's quota.
  let markerCountsOfMaps: number[];
  let pinnedPhotoService: PinnedPhotoService;

  function loadGoogleMapsApi(): void {
    const markerCounts = markerCountsOfMaps;
    (window as unknown as { google: unknown }).google = { maps: {
      Map: class {
        public readonly index = markerCounts.push(0) - 1;
        public fitBounds(): void {}
        public getZoom(): number { return 10; }
        public setZoom(): void {}
      },
      Marker: class {
        public readonly position: unknown;
        constructor({ position, map }: { position: unknown, map: { index: number } }) {
          this.position = position;
          markerCounts[map.index]++;
        }
      },
      MapTypeId: { ROADMAP: 'roadmap' },
      LatLng: class {},
      LatLngBounds: class { public extend(): void {} },
      InfoWindow: class {},
      event: { addListener(): void {}, addListenerOnce(): void {} },
    } };
  }

  beforeEach(async () => {
    markerCountsOfMaps = [];
    await TestBed.configureTestingModule({ declarations: [GoogleMapsComponent] }).compileComponents();
    pinnedPhotoService = TestBed.inject(PinnedPhotoService);
  });

  afterEach(() => {
    delete (window as unknown as { google?: unknown }).google;
  });

  it('creates one map for the pinned photos when the API has loaded before, and one more when others are pinned', async () => {
    loadGoogleMapsApi();
    pinnedPhotoService.setPinnedPhotos([photo('a.jpg', 35, 135), photo('b.jpg', 36, 136)]);
    const fixture = TestBed.createComponent(GoogleMapsComponent);
    await fixture.whenStable();
    expect(markerCountsOfMaps).toEqual([2]);

    pinnedPhotoService.setPinnedPhotos([photo('a.jpg', 35, 135)]);
    await fixture.whenStable();
    expect(markerCountsOfMaps).toEqual([2, 1]);
  });

  it('creates one map once the API loads, for the photos pinned by then', async () => {
    pinnedPhotoService.setPinnedPhotos([photo('a.jpg', 35, 135)]);
    const fixture = TestBed.createComponent(GoogleMapsComponent);
    await fixture.whenStable();
    pinnedPhotoService.setPinnedPhotos([photo('a.jpg', 35, 135), photo('b.jpg', 36, 136)]);
    await fixture.whenStable();
    expect(markerCountsOfMaps).toEqual([]);

    loadGoogleMapsApi();
    await vi.waitFor(() => expect(markerCountsOfMaps).toEqual([2]));
    await fixture.whenStable();
    expect(markerCountsOfMaps).toEqual([2]);
  });
});
