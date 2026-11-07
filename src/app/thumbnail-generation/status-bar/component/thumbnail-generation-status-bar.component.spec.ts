import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

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
    numOfProcessedThumbnails: 0, progressPercent: 0, result: null,
  };

  beforeEach(async () => {
    status.set(idleThumbnailGenerationStatus);
    await TestBed.configureTestingModule({
      declarations: [ ThumbnailGenerationStatusBarComponent ],
      imports: [
        MatIconModule,
        MatProgressBarModule
      ],
      providers: [{ provide: ThumbnailGenerationService, useValue: { status } }],
    })
    .compileComponents();
    fixture = TestBed.createComponent(ThumbnailGenerationStatusBarComponent);
    await fixture.whenStable();
  });

  it('follows the generation from start to end, without being asked to', async () => {
    status.set(generating);
    await fixture.whenStable();
    expect(text('.summary')).toBe('Generating thumbnails for HEIF files...');
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
