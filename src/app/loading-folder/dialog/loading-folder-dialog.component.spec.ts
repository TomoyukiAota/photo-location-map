import { signal } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
  LoadingFolderProgressReporterService,
  LoadingFolderProgressStatus,
  notStartedLoadingFolderProgressStatus,
} from '../progress-reporter/loading-folder-progress-reporter.service';
import { LoadingFolderDialogComponent } from './loading-folder-dialog.component';

describe('LoadingFolderDialogComponent', () => {
  const status = signal<LoadingFolderProgressStatus>(notStartedLoadingFolderProgressStatus);
  const startUpdatingProgress = vi.fn();
  let fixture: ComponentFixture<LoadingFolderDialogComponent>;
  const text = () => (fixture.nativeElement as HTMLElement).textContent.replace(/\s+/g, ' ').trim();

  beforeEach(async () => {
    status.set(notStartedLoadingFolderProgressStatus);
    startUpdatingProgress.mockClear();
    await TestBed.configureTestingModule({
      declarations: [ LoadingFolderDialogComponent ],
      imports: [ MatProgressBarModule ],
      providers: [{ provide: LoadingFolderProgressReporterService, useValue: { status, startUpdatingProgress } }],
    })
    .compileComponents();
    fixture = TestBed.createComponent(LoadingFolderDialogComponent);
    await fixture.whenStable();
  });

  it('starts the progress updates and first shows that it collects the files', () => {
    expect(startUpdatingProgress).toHaveBeenCalledTimes(1);
    expect(text()).toBe('Collecting files to load from the opened folder...');
  });

  it('follows the progress as it changes, without being asked to', async () => {
    status.set({ numberOfLoadedFiles: 1, numberOfAllFilesToLoad: 2, loadedPercent: 50, isStarted: true, isInProgress: true, isCompleted: false });
    await fixture.whenStable();
    expect(text()).toBe('Loading files from the opened folder... Loaded 1 files out of 2 files.');

    status.set({ numberOfLoadedFiles: 2, numberOfAllFilesToLoad: 2, loadedPercent: 100, isStarted: true, isInProgress: false, isCompleted: true });
    await fixture.whenStable();
    expect(text()).toBe('Completed loading all files (2 files). Generating the map using the loaded files...');
  });
});
