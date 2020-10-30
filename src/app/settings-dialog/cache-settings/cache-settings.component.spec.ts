import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CacheSettingsComponent } from './cache-settings.component';

describe('CacheSettingsComponent', () => {
  let component: CacheSettingsComponent;
  let fixture: ComponentFixture<CacheSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CacheSettingsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CacheSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
