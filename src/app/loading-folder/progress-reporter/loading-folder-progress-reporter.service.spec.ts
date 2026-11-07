import { TestBed } from '@angular/core/testing';
import { LoadingFolderProgress } from '../../shared/loading-folder-progress';
import { LoadingFolderProgressReporterService, notStartedLoadingFolderProgressStatus } from './loading-folder-progress-reporter.service';

describe('LoadingFolderProgressReporterService', () => {
  let service: LoadingFolderProgressReporterService;

  beforeEach(() => {
    vi.useFakeTimers();
    LoadingFolderProgress.reset();
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoadingFolderProgressReporterService);
  });

  afterEach(() => {
    LoadingFolderProgress.reset();
    vi.useRealTimers();
  });

  it('reports the progress of loading every 100 ms, and stops once loading completes', () => {
    service.startUpdatingProgress();
    expect(service.status()).toEqual(notStartedLoadingFolderProgressStatus);

    LoadingFolderProgress.setNumberOfAllFilesToLoad(2);
    LoadingFolderProgress.incrementNumberOfLoadedFiles();
    vi.advanceTimersByTime(100);
    expect(service.status()).toEqual({
      numberOfLoadedFiles: 1, numberOfAllFilesToLoad: 2, loadedPercent: 50, isStarted: true, isInProgress: true, isCompleted: false,
    });

    LoadingFolderProgress.incrementNumberOfLoadedFiles();
    vi.advanceTimersByTime(100);
    expect(service.status()).toMatchObject({ numberOfLoadedFiles: 2, isInProgress: false, isCompleted: true });
    expect(vi.getTimerCount()).toBe(0);
  });

  it('starts the next folder from collecting its files, not from where the previous one ended', () => {
    service.startUpdatingProgress();
    LoadingFolderProgress.setNumberOfAllFilesToLoad(1);
    LoadingFolderProgress.incrementNumberOfLoadedFiles();
    vi.advanceTimersByTime(100);
    expect(service.status().isCompleted).toBe(true);

    LoadingFolderProgress.reset();
    service.startUpdatingProgress();
    expect(service.status()).toEqual(notStartedLoadingFolderProgressStatus);
    expect(vi.getTimerCount()).toBe(1);
  });
});
