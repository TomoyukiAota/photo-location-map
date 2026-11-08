import { ComponentFixture, TestBed } from '@angular/core/testing';
import * as path from 'node:path';

import { CacheSettingsComponent } from './cache-settings.component';

describe('CacheSettingsComponent', () => {
  let component: CacheSettingsComponent;
  let fixture: ComponentFixture<CacheSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CacheSettingsComponent],
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CacheSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create with an isolated cache directory', () => {
    expect(component).toBeTruthy();
    expect(process.env.PLM_TEST_ROOT).toBeTruthy();
    const relativeCachePath = path.relative(process.env.PLM_TEST_ROOT, component.thumbnailCacheLocation);
    expect(path.isAbsolute(relativeCachePath)).toBe(false);
    expect(relativeCachePath.startsWith('..')).toBe(false);
  });
});
