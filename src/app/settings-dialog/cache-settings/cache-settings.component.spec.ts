import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Logger } from '../../../../src-shared/log/logger';
import { startupMetadata } from '../../../../src-shared/startup/startup-metadata';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { CacheSettingsComponent } from './cache-settings.component';

describe('CacheSettingsComponent', () => {
  let component: CacheSettingsComponent;
  let fixture: ComponentFixture<CacheSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CacheSettingsComponent],
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CacheSettingsComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the cache folder that the main process reported, and has the main process open it', () => {
    // The startup metadata, read once, as the app reads it: the first test file's bridge double gave it.
    expect(component.thumbnailCacheLocation).toBe(startupMetadata().thumbnailCacheDir);
    expect(component.thumbnailCacheLocation.endsWith('thumbnail-cache')).toBe(true);
    const open = vi.spyOn(window.plm.thumbnailCache, 'open');
    component.openThumbnailCacheLocation();
    expect(open).toHaveBeenCalledExactlyOnceWith();
  });

  it('deletes the cache only once the user confirms, which the main process does before it restarts the app', async () => {
    const deleteAndRestart = vi.spyOn(window.plm.thumbnailCache, 'deleteAndRestart');
    const confirm = vi.spyOn(TestBed.inject(ConfirmDialogService), 'confirm').mockResolvedValueOnce(false).mockResolvedValueOnce(true);

    await component.handleDeleteThumbnailCacheButtonClicked();
    expect(deleteAndRestart).not.toHaveBeenCalled();
    await component.handleDeleteThumbnailCacheButtonClicked();
    expect(deleteAndRestart).toHaveBeenCalledExactlyOnceWith();
    expect(confirm).toHaveBeenCalledTimes(2);
    expect(confirm).toHaveBeenCalledWith('This application will restart after deleting the thumbnail cache.\nDo you want to continue?');
  });

  it('shows the sentence about the files whose thumbnails are made, with its link around the words of the translation', () => {
    fixture.detectChanges();
    const host: HTMLElement = fixture.nativeElement;
    const sentence = host.querySelector('.cache-description p');
    expect(sentence.textContent).toBe('Thumbnail generation is required for JPEG/PNG files without a large enough thumbnail in their EXIF data, '
      + 'and for HEIF files that this computer cannot decode with its graphics hardware, but it takes time.');
    expect(sentence.querySelector('a').textContent).toBe('HEIF files');
  });

  it.each([
    { bytes: 0, formattedSize: '0 MB' },
    { bytes: 125_500_000, formattedSize: '125.5 MB' },
    { bytes: 1_250_000_000, formattedSize: '1.25 GB' },
  ])('shows a loading message, then formats a cache of $bytes bytes as $formattedSize', async ({ bytes, formattedSize }) => {
    const size = vi.spyOn(window.plm.thumbnailCache, 'size').mockResolvedValue(bytes);
    fixture.detectChanges();
    const host: HTMLElement = fixture.nativeElement;
    const sizeValue = host.querySelector('.cache-size-value');
    expect(size).toHaveBeenCalledExactlyOnceWith();
    expect(sizeValue.textContent).toBe('Calculating…');

    await fixture.whenStable();
    fixture.detectChanges();
    expect(sizeValue.textContent).toBe(formattedSize);
  });

  it('shows that the size is unavailable if the cache cannot be measured', async () => {
    vi.spyOn(window.plm.thumbnailCache, 'size').mockRejectedValue(new Error('The cache cannot be read.'));
    vi.spyOn(Logger, 'error').mockImplementation(() => {});
    fixture.detectChanges();
    const host: HTMLElement = fixture.nativeElement;

    await fixture.whenStable();
    fixture.detectChanges();
    expect(host.querySelector('.cache-size-value').textContent).toBe('Unavailable');
  });
});
