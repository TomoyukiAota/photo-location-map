import { MatProgressSpinnerModule } from '@angular/material';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LoadingFolderDialogComponent } from './loading-folder-dialog.component';

describe('FolderSelectionProgressComponent', () => {
  let component: LoadingFolderDialogComponent;
  let fixture: ComponentFixture<LoadingFolderDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LoadingFolderDialogComponent ],
      imports: [ MatProgressSpinnerModule ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoadingFolderDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
