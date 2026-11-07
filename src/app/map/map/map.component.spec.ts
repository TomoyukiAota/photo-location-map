import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IpcConstants } from '../../../../src-shared/ipc/ipc-constants';

import { MapComponent } from './map.component';

// Child map rendering is covered by the application E2E suite. Keep this
// construction test independent of native map and worker initialization.
@Component({
  selector: 'app-leaflet-map', template: '',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
class DummyLeafletMapComponent {}

@Component({
  selector: 'app-google-maps', template: '',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
class DummyGoogleMapsComponent {}

describe('MapComponent', () => {
  let component: MapComponent;
  let fixture: ComponentFixture<MapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        MapComponent,
        DummyLeafletMapComponent,
        DummyGoogleMapsComponent,
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows OpenStreetMap first, then the map that the Help menu chooses', async () => {
    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelector('app-leaflet-map')).not.toBeNull();
    expect(host.querySelector('app-google-maps')).toBeNull();

    window.plmInternalRenderer.map.changeMap(IpcConstants.Map.ChangeEvent.Arg.GoogleMaps);
    await fixture.whenStable();
    expect(host.querySelector('app-google-maps')).not.toBeNull();
    expect(host.querySelector('app-leaflet-map')).toBeNull();

    window.plmInternalRenderer.map.changeMap(IpcConstants.Map.ChangeEvent.Arg.OpenStreetMap);
    await fixture.whenStable();
    expect(host.querySelector('app-leaflet-map')).not.toBeNull();
    expect(host.querySelector('app-google-maps')).toBeNull();

    fixture.destroy();
    expect(window.plmInternalRenderer.map.changeMap).toBeNull();
  });
});
