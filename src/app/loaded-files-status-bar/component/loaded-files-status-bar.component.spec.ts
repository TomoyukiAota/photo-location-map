import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoadedFilesStatusBarComponent } from './loaded-files-status-bar.component';

describe('LoadedFilesStatusBarComponent', () => {
  let component: LoadedFilesStatusBarComponent;
  let fixture: ComponentFixture<LoadedFilesStatusBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LoadedFilesStatusBarComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoadedFilesStatusBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
