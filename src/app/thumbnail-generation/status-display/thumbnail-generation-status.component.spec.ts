import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThumbnailGenerationStatusComponent } from './thumbnail-generation-status.component';

describe('ThumbnailGenerationStatusComponent', () => {
  let component: ThumbnailGenerationStatusComponent;
  let fixture: ComponentFixture<ThumbnailGenerationStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ThumbnailGenerationStatusComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ThumbnailGenerationStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
