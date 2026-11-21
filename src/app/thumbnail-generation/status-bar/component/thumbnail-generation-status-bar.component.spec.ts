import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { currentUserSettings } from '../../../../../src-shared/user-settings/user-settings';
import { SettingsDialogService } from '../../../settings-dialog/service/settings-dialog.service';

import {
  idleThumbnailGenerationStatus,
  ThumbnailGenerationService,
  ThumbnailGenerationStatus,
} from '../../service/thumbnail-generation.service';
import { ThumbnailGenerationStatusBarService } from '../service/thumbnail-generation-status-bar.service';
import { ThumbnailGenerationStatusBarComponent } from './thumbnail-generation-status-bar.component';

describe('ThumbnailGenerationStatusBarComponent', () => {
  const status = signal<ThumbnailGenerationStatus>(idleThumbnailGenerationStatus);
  let fixture: ComponentFixture<ThumbnailGenerationStatusBarComponent>;
  const element = () => fixture.nativeElement as HTMLElement;
  const text = (selector: string) => element().querySelector(selector).textContent.replace(/\s+/g, ' ').trim();
  const generating: ThumbnailGenerationStatus = {
    phase: 'generating', numOfAllHeifFiles: 3, numOfCacheAvailableThumbnails: 1, numOfGenerationRequiredThumbnails: 2,
    numOfProcessedThumbnails: 0, progressPercent: 0, result: null, isWholeFolder: true,
  };
  const settingsDialogService = { open: vi.fn() };

  beforeEach(async () => {
    status.set(idleThumbnailGenerationStatus);
    await TestBed.configureTestingModule({
      imports: [ThumbnailGenerationStatusBarComponent],
      providers: [
        { provide: ThumbnailGenerationService, useValue: { status } },
        { provide: SettingsDialogService, useValue: settingsDialogService },
      ],
    })
    .compileComponents();
    fixture = TestBed.createComponent(ThumbnailGenerationStatusBarComponent);
    await fixture.whenStable();
  });

  it('follows the generation from start to end, without being asked to', async () => {
    status.set(generating);
    await fixture.whenStable();
    expect(text('.summary')).toBe('Generating thumbnails for HEIF files... To show them sooner, choose fast thumbnails in Settings.');
    expect(text('.details')).toContain('Processed 0 out of 2 files.');
    expect(text('.details')).toContain('2 thumbnails need generation, which is given by "HEIF files (3 files) − Cache-available files (1 files)".');
    expect(element().querySelector('.close-button').classList).toContain('hidden');

    status.set({ ...generating, numOfProcessedThumbnails: 1, progressPercent: 50 });
    await fixture.whenStable();
    expect(text('.details')).toContain('Processed 1 out of 2 files.');

    status.set({ ...generating, phase: 'done', numOfProcessedThumbnails: 2, progressPercent: 100,
      result: { errorOccurred: false, filePathsWithoutThumbnail: [] } });
    await fixture.whenStable();
    expect(text('.summary')).toBe('Completed generating thumbnails for HEIF files.');
    expect(element().querySelector('.close-button').classList).not.toContain('hidden');
  });

  it('offers the fast thumbnails while thumbnails of high quality are made, through the Settings dialog', async () => {
    settingsDialogService.open.mockClear();
    status.set(generating);
    await fixture.whenStable();
    const link = element().querySelector('.faster-in-settings .anchor-tag-like-text') as HTMLElement;
    expect(link.textContent).toBe('choose fast thumbnails in Settings');
    link.click();
    expect(settingsDialogService.open).toHaveBeenCalledExactlyOnceWith('thumbnails');
  });

  it('offers nothing more where the thumbnails are fast already', async () => {
    const quality = currentUserSettings.thumbnailQuality;
    currentUserSettings.thumbnailQuality = 'fast';
    try {
      status.set({ ...generating });
      await fixture.whenStable();
      expect(text('.summary')).toBe('Generating thumbnails for HEIF files...');
    } finally {
      currentUserSettings.thumbnailQuality = quality;
    }
  });

  it('counts the folder\'s files only for a generation of the whole folder', async () => {
    status.set({ ...generating, isWholeFolder: false });
    await fixture.whenStable();
    expect(text('.details')).toContain('Processed 0 out of 2 files.');
    expect(element().querySelector('.generation-required-files-description')).toBeNull();
  });

  it('offers the files with errors once a generation finishes with errors', async () => {
    status.set({ ...generating, phase: 'done', numOfProcessedThumbnails: 2, progressPercent: 100,
      result: { errorOccurred: true, filePathsWithoutThumbnail: ['/photos/a.heic'] } });
    await fixture.whenStable();
    expect(text('.summary')).toBe('Finished generating thumbnails for HEIF files with errors.');
    expect(text('.details')).toContain('Processed 2 out of 2 files with errors. Click here to see the files with errors.');
  });

  it('opens and closes its details, and closes through the status bar service', async () => {
    const statusBarService = TestBed.inject(ThumbnailGenerationStatusBarService);
    statusBarService.showForNewGeneration();
    const details = () => element().querySelector('.progress-bar-with-details');
    expect(details().classList).toContain('shrunk-progress-bar-with-details');

    (details() as HTMLElement).click();
    await fixture.whenStable();
    expect(details().classList).toContain('expanded-progress-bar-with-details');

    (element().querySelector('.close-button') as HTMLElement).click();
    expect(statusBarService.visible()).toBe(false);
  });
});
