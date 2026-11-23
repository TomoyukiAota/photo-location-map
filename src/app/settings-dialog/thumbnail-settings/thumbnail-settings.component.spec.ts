import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSliderHarness } from '@angular/material/slider/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { currentUserSettings } from '../../../../src-shared/user-settings/user-settings';
import { SettingsChangedService } from '../service/settings-changed.service';
import { ThumbnailSettingsChangedParameter } from './thumbnail-settings-changed-parameter';
import { ThumbnailSettingsComponent } from './thumbnail-settings.component';

describe('ThumbnailSettingsComponent', () => {
  let fixture: ComponentFixture<ThumbnailSettingsComponent>;
  const element = () => fixture.nativeElement as HTMLElement;
  const choices = () => Array.from(element().querySelectorAll<HTMLElement>('mat-radio-button'));
  const sizeBlock = () => element().querySelector<HTMLElement>('.thumbnail-size');
  const slider = () => TestbedHarnessEnvironment.loader(fixture).getHarness(MatSliderHarness);
  let quality: typeof currentUserSettings.thumbnailQuality;
  let size: number;

  beforeEach(async () => {
    quality = currentUserSettings.thumbnailQuality;
    size = currentUserSettings.thumbnailSize;
    await TestBed.configureTestingModule({ imports: [ThumbnailSettingsComponent] }).compileComponents();
  });

  afterEach(() => {
    currentUserSettings.thumbnailQuality = quality;
    currentUserSettings.thumbnailSize = size;
  });

  async function create(): Promise<void> {
    fixture = TestBed.createComponent(ThumbnailSettingsComponent);
    await fixture.whenStable();
  }

  /** What the tab tells the dialog, which the dialog saves. */
  function changesTold(): ThumbnailSettingsChangedParameter[] {
    const changes: ThumbnailSettingsChangedParameter[] = [];
    TestBed.inject(SettingsChangedService).thumbnailSettingsChanged.subscribe(change => changes.push(change));
    return changes;
  }

  it('offers high quality and fast thumbnails, each with what it does, the one in use chosen', async () => {
    currentUserSettings.thumbnailQuality = 'high';
    await create();
    expect(element().querySelector('.setting-title').textContent).toBe('Thumbnails');
    expect(choices().map(choice => choice.querySelector('.thumbnail-quality-label').textContent)).toEqual(['High quality', 'Fast']);
    expect(choices()[0].querySelector('.thumbnail-quality-description').textContent).toContain('at the size chosen below');
    expect(choices()[1].querySelector('.thumbnail-quality-description').textContent).toContain('160 × 120 pixels');
    expect(choices()[0].querySelector('input').checked).toBe(true);
    expect(choices()[1].querySelector('input').checked).toBe(false);
  });

  it('tells the dialog of the quality chosen, with the size, which the dialog saves', async () => {
    currentUserSettings.thumbnailQuality = 'high';
    currentUserSettings.thumbnailSize = 600;
    await create();
    const changes = changesTold();

    choices()[1].querySelector('input').click();
    await fixture.whenStable();

    expect(changes).toEqual([{ thumbnailQuality: 'fast', thumbnailSize: 600 }]);
    expect(currentUserSettings.thumbnailQuality).toBe('high');
  });

  it('has the slider of the size right under High quality, from 400 to 1,000 pixels in steps of 100, at the size in use', async () => {
    currentUserSettings.thumbnailQuality = 'high';
    currentUserSettings.thumbnailSize = 700;
    await create();

    expect(choices()[0].nextElementSibling).toBe(sizeBlock());
    expect(sizeBlock().querySelector('.thumbnail-size-label').textContent).toBe('Size');
    expect(sizeBlock().querySelector('.thumbnail-size-value').textContent).toBe('700 pixels on the longer side');
    const harness = await slider();
    expect([await harness.getMinValue(), await harness.getMaxValue(), await harness.getStep()]).toEqual([400, 1000, 100]);
    expect(await (await harness.getEndThumb()).getValue()).toBe(700);
    expect(await harness.isDisabled()).toBe(false);
  });

  it('tells the dialog of the size chosen with the slider, and shows it', async () => {
    currentUserSettings.thumbnailQuality = 'high';
    currentUserSettings.thumbnailSize = 400;
    await create();
    const changes = changesTold();

    await (await (await slider()).getEndThumb()).setValue(900);
    await fixture.whenStable();

    expect(changes.at(-1)).toEqual({ thumbnailQuality: 'high', thumbnailSize: 900 });
    expect(sizeBlock().querySelector('.thumbnail-size-value').textContent).toBe('900 pixels on the longer side');
    expect(currentUserSettings.thumbnailSize).toBe(400);
  });

  it('keeps the quality chosen when the slider\'s input fires its change event, which bubbles to the radio group', async () => {
    currentUserSettings.thumbnailQuality = 'high';
    currentUserSettings.thumbnailSize = 400;
    await create();
    const changes = changesTold();

    // As a pointer or Playwright's fill() leaves it: an input event, then a change event that bubbles.
    const input = sizeBlock().querySelector<HTMLInputElement>('input');
    input.value = '800';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await fixture.whenStable();

    expect(changes.length).toBeGreaterThan(0);
    expect(changes.every(change => change.thumbnailQuality === 'high')).toBe(true);
    expect(changes.at(-1)).toEqual({ thumbnailQuality: 'high', thumbnailSize: 800 });
  });

  it('disables the slider while Fast is chosen, which shows the thumbnails that the photos hold', async () => {
    currentUserSettings.thumbnailQuality = 'fast';
    await create();
    expect(await (await slider()).isDisabled()).toBe(true);
    expect(sizeBlock().classList).toContain('thumbnail-size-disabled');

    choices()[0].querySelector('input').click();
    await fixture.whenStable();
    expect(await (await slider()).isDisabled()).toBe(false);
    expect(sizeBlock().classList).not.toContain('thumbnail-size-disabled');
  });

  it('has the cache of the thumbnails that are made under the choices, with a title of its own', async () => {
    await create();
    expect(Array.from(element().querySelectorAll('.setting-title'), title => title.textContent)).toEqual(['Thumbnails', 'Thumbnail Cache']);
    const cache = element().querySelector('app-cache-settings');
    expect(element().querySelector('mat-radio-group').compareDocumentPosition(cache) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(cache.querySelector('.delete-button').textContent.trim()).toBe('Delete Thumbnail Cache');
  });
});
