import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyProgressBarModule as MatProgressBarModule } from '@angular/material/legacy-progress-bar';

import { ThumbnailGenerationStatusBarComponent } from './thumbnail-generation-status-bar.component';

describe('ThumbnailGenerationStatusBarComponent', () => {
  let component: ThumbnailGenerationStatusBarComponent;
  let fixture: ComponentFixture<ThumbnailGenerationStatusBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ThumbnailGenerationStatusBarComponent ],
      imports: [
        MatIconModule,
        MatProgressBarModule
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ThumbnailGenerationStatusBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
