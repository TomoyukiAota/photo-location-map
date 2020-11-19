import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';

import { NoPhotosWithGpsLocationDialogComponent } from './no-photos-with-gps-location-dialog.component';

describe('NoPhotosWithGpsLocationDialogComponent', () => {
  let component: NoPhotosWithGpsLocationDialogComponent;
  let fixture: ComponentFixture<NoPhotosWithGpsLocationDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NoPhotosWithGpsLocationDialogComponent ],
      imports: [ MatButtonModule ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NoPhotosWithGpsLocationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
