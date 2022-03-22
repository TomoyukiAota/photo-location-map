import { Component } from '@angular/core';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { MockComponents } from 'ng-mocks';
import { GoogleMapsComponent } from '../google-maps/google-maps.component';

import { MapComponent } from './map.component';

// Dummy component of LeafletMapComponent is defined because using ng-mocks results in "ReferenceError: L is not defined".
@Component({ selector: 'app-leaflet-map', template: '' })
class DummyLeafletMapComponent {}

describe('MapComponent', () => {
  let component: MapComponent;
  let fixture: ComponentFixture<MapComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        MapComponent,
        DummyLeafletMapComponent,
        MockComponents(
          GoogleMapsComponent,
        ),
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
