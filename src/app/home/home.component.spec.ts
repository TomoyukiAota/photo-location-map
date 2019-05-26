import { Component } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { AngularSplitModule } from 'angular-split';

import { HomeComponent } from './home.component';

@Component({ selector: 'app-sidebar', template: '' })
class DummySidebarComponent {}

@Component({ selector: 'app-map', template: '' })
class DummyMapComponent {}

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HomeComponent, DummySidebarComponent, DummyMapComponent ],
      imports: [
        AngularSplitModule.forRoot()
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
