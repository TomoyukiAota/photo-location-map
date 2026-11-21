import { ComponentFixture, TestBed } from '@angular/core/testing';
import { currentUserSettings } from '../../../../src-shared/user-settings/user-settings';
import { SettingsChangedService } from '../service/settings-changed.service';
import { ThumbnailSettingsChangedParameter } from './thumbnail-settings-changed-parameter';
import { ThumbnailSettingsComponent } from './thumbnail-settings.component';

describe('ThumbnailSettingsComponent', () => {
  let fixture: ComponentFixture<ThumbnailSettingsComponent>;
  const element = () => fixture.nativeElement as HTMLElement;
  const choices = () => Array.from(element().querySelectorAll<HTMLElement>('mat-radio-button'));
  let quality: typeof currentUserSettings.thumbnailQuality;

  beforeEach(async () => {
    quality = currentUserSettings.thumbnailQuality;
    await TestBed.configureTestingModule({ imports: [ThumbnailSettingsComponent] }).compileComponents();
  });

  afterEach(() => { currentUserSettings.thumbnailQuality = quality; });

  async function create(): Promise<void> {
    fixture = TestBed.createComponent(ThumbnailSettingsComponent);
    await fixture.whenStable();
  }

  it('offers high quality and fast thumbnails, each with what it does, the one in use chosen', async () => {
    currentUserSettings.thumbnailQuality = 'high';
    await create();
    expect(element().querySelector('.setting-title').textContent).toBe('HEIF Thumbnails');
    expect(choices().map(choice => choice.querySelector('.thumbnail-quality-label').textContent)).toEqual(['High quality', 'Fast']);
    expect(choices()[0].querySelector('.thumbnail-quality-description').textContent).toContain('400 pixels');
    expect(choices()[1].querySelector('.thumbnail-quality-description').textContent).toContain('320 × 240 pixels');
    expect(choices()[0].querySelector('input').checked).toBe(true);
    expect(choices()[1].querySelector('input').checked).toBe(false);
  });

  it('tells the dialog of the quality chosen, which the dialog saves', async () => {
    currentUserSettings.thumbnailQuality = 'high';
    await create();
    const changes: ThumbnailSettingsChangedParameter[] = [];
    TestBed.inject(SettingsChangedService).thumbnailSettingsChanged.subscribe(change => changes.push(change));

    choices()[1].querySelector('input').click();
    await fixture.whenStable();

    expect(changes).toEqual([{ thumbnailQuality: 'fast' }]);
    expect(currentUserSettings.thumbnailQuality).toBe('high');
  });
});
