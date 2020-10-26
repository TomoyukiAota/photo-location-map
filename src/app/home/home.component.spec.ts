import { Component } from '@angular/core';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeComponent } from './home.component';

@Component({ selector: 'app-sidebar', template: '' })
class DummySidebarComponent {}

@Component({ selector: 'app-map', template: '' })
class DummyMapComponent {}

@Component({ selector: 'app-thumbnail-generation-status', template: '' })
class DummyThumbnailGenerationStatusComponent {}

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        HomeComponent,
        DummySidebarComponent,
        DummyMapComponent,
        DummyThumbnailGenerationStatusComponent
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
