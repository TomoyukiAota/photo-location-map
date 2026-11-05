import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

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
});
