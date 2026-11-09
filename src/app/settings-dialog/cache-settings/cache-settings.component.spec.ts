import { ComponentFixture, TestBed } from '@angular/core/testing';

import { startupMetadata } from '../../../../src-shared/startup/startup-metadata';
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
    fixture.detectChanges();
  });

  it('shows the cache folder that the main process reported, and has the main process open it', () => {
    // The startup metadata, read once, as the app reads it: the first test file's bridge double gave it.
    expect(component.thumbnailCacheLocation).toBe(startupMetadata().thumbnailCacheDir);
    expect(component.thumbnailCacheLocation.endsWith('thumbnail-cache')).toBe(true);
    const open = vi.spyOn(window.plm.thumbnailCache, 'open');
    component.openThumbnailCacheLocation();
    expect(open).toHaveBeenCalledExactlyOnceWith();
  });

  it('deletes the cache only once the user confirms, which the main process does before it restarts the app', () => {
    const deleteAndRestart = vi.spyOn(window.plm.thumbnailCache, 'deleteAndRestart');
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);

    component.handleDeleteThumbnailCacheButtonClicked();
    expect(deleteAndRestart).not.toHaveBeenCalled();
    component.handleDeleteThumbnailCacheButtonClicked();
    expect(deleteAndRestart).toHaveBeenCalledExactlyOnceWith();
    expect(confirm).toHaveBeenCalledTimes(2);
    confirm.mockRestore();
  });
});
