import { MatProgressBarModule } from '@angular/material/progress-bar';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { LoadingFolderDialogComponent } from './loading-folder-dialog.component';

describe('LoadingFolderDialogComponent', () => {
  let component: LoadingFolderDialogComponent;
  let fixture: ComponentFixture<LoadingFolderDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ LoadingFolderDialogComponent ],
      imports: [ MatProgressBarModule ]
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
