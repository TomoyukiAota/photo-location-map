import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppearanceSettingsComponent } from './appearance-settings.component';

describe('AppearanceSettingsComponent', () => {
  let component: AppearanceSettingsComponent;
  let fixture: ComponentFixture<AppearanceSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AppearanceSettingsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppearanceSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
