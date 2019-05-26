import { AgmCoreModule } from '@agm/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GoogleMapsComponent } from './google-maps.component';

describe('GoogleMapsComponent', () => {
  let component: GoogleMapsComponent;
  let fixture: ComponentFixture<GoogleMapsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        AgmCoreModule.forRoot({
          apiKey: ''
        })
      ],
      declarations: [ GoogleMapsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GoogleMapsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
