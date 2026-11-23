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

  it('reports the progress of loading right after it starts and every 100 ms, and stops once loading completes', () => {
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

  it('reports the progress right after it starts, as of a folder whose photos were read before its dialog was made', () => {
    LoadingFolderProgress.setNumberOfAllFilesToLoad(3);
    for (let file = 0; file < 3; file++)
      LoadingFolderProgress.incrementNumberOfLoadedFiles();

    service.startUpdatingProgress();
    // First that the files are being collected, as for any folder, then what is so.
    expect(service.status()).toEqual(notStartedLoadingFolderProgressStatus);
    vi.advanceTimersByTime(0);
    expect(service.status()).toMatchObject({ numberOfLoadedFiles: 3, isInProgress: false, isCompleted: true });
    expect(vi.getTimerCount()).toBe(0);
  });

  it('reports the progress when asked, as the open does once the photos are read, and then stops', () => {
    service.startUpdatingProgress();
    vi.advanceTimersByTime(30);
    LoadingFolderProgress.setNumberOfAllFilesToLoad(1);
    LoadingFolderProgress.incrementNumberOfLoadedFiles();

    service.reportProgress();
    expect(service.status()).toMatchObject({ numberOfLoadedFiles: 1, isCompleted: true });
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

  it('stops reporting a folder that did not finish loading when the next one starts', () => {
    service.startUpdatingProgress();
    LoadingFolderProgress.setNumberOfAllFilesToLoad(2);
    LoadingFolderProgress.incrementNumberOfLoadedFiles();
    vi.advanceTimersByTime(100);
    expect(service.status()).toMatchObject({ numberOfLoadedFiles: 1, isInProgress: true });
    expect(vi.getTimerCount()).toBe(1);

    LoadingFolderProgress.reset();
    service.startUpdatingProgress();
    expect(service.status()).toEqual(notStartedLoadingFolderProgressStatus);
    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(100);
    expect(service.status()).toEqual(notStartedLoadingFolderProgressStatus);
  });
});
