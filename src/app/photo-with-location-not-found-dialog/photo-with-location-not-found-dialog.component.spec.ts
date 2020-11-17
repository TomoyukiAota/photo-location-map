import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';

import { PhotoWithLocationNotFoundDialogComponent } from './photo-with-location-not-found-dialog.component';

describe('PhotoWithLocationNotFoundDialogComponent', () => {
  let component: PhotoWithLocationNotFoundDialogComponent;
  let fixture: ComponentFixture<PhotoWithLocationNotFoundDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PhotoWithLocationNotFoundDialogComponent ],
      imports: [ MatButtonModule ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PhotoWithLocationNotFoundDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
