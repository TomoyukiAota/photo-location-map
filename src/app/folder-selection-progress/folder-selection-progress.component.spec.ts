import { MatProgressSpinnerModule } from '@angular/material';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FolderSelectionProgressComponent } from './folder-selection-progress.component';

describe('FolderSelectionProgressComponent', () => {
  let component: FolderSelectionProgressComponent;
  let fixture: ComponentFixture<FolderSelectionProgressComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FolderSelectionProgressComponent ],
      imports: [ MatProgressSpinnerModule ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FolderSelectionProgressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
