import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThumbnailGenerationStatusDisplayComponent } from './thumbnail-generation-status-display.component';

describe('ThumbnailGenerationStatusDisplayComponent', () => {
  let component: ThumbnailGenerationStatusDisplayComponent;
  let fixture: ComponentFixture<ThumbnailGenerationStatusDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ThumbnailGenerationStatusDisplayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ThumbnailGenerationStatusDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
