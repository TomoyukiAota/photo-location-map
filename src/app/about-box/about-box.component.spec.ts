import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AboutBoxComponent } from './about-box.component';

describe('AboutBoxComponent', () => {
  let component: AboutBoxComponent;
  let fixture: ComponentFixture<AboutBoxComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AboutBoxComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AboutBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
