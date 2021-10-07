import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';

import { NoPhotosWithLocationDataDialogComponent } from './no-photos-with-location-data-dialog.component';

describe('NoPhotosWithLocationDataDialogComponent', () => {
  let component: NoPhotosWithLocationDataDialogComponent;
  let fixture: ComponentFixture<NoPhotosWithLocationDataDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NoPhotosWithLocationDataDialogComponent ],
      imports: [ MatButtonModule ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NoPhotosWithLocationDataDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
