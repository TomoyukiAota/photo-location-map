import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThumbnailGenerationStatusBarComponent } from './thumbnail-generation-status-bar.component';

describe('ThumbnailGenerationStatusBarComponent', () => {
  let component: ThumbnailGenerationStatusBarComponent;
  let fixture: ComponentFixture<ThumbnailGenerationStatusBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ThumbnailGenerationStatusBarComponent ]
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
