import { OverlayContainer } from '@angular/cdk/overlay';
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
    expect(element().querySelector('.setting-title').textContent).toBe('Thumbnail Quality and App Performance');
    expect(choices().map(choice => choice.querySelector('.thumbnail-quality-label').textContent)).toEqual(['Prefer thumbnail quality', 'Prefer app performance']);
    expect(choices()[0].querySelector('.thumbnail-quality-description').textContent).toContain('generated from the photo files');
    expect(choices()[1].querySelector('.thumbnail-quality-description').textContent).toContain('400 pixels on the longer side is generated only for a file that holds none');
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
    expect(sizeBlock().querySelector('.thumbnail-size-label').textContent).toBe('Thumbnail size');
    expect(sizeBlock().querySelector('input').getAttribute('aria-valuetext')).toBe('700 pixels on the longer side');
    const harness = await slider();
    expect([await harness.getMinValue(), await harness.getMaxValue(), await harness.getStep()]).toEqual([400, 1000, 100]);
    expect(await (await harness.getEndThumb()).getValue()).toBe(700);
    expect(await harness.isDisabled()).toBe(false);
  });

  it('writes the first size, the last, and every other one between them under the slider', async () => {
    await create();
    const ticks = Array.from(sizeBlock().querySelectorAll('.thumbnail-size-scale .thumbnail-size-tick'), tick => tick.textContent);
    expect(ticks).toEqual(['400 px', '600 px', '800 px', '1000 px']);
    expect(sizeBlock().querySelector('.thumbnail-size-ticks').getAttribute('aria-hidden')).toBe('true');
  });

  it('opens the note on what a larger size costs with the button after the slider, which closes it as a click elsewhere and Escape do', async () => {
    currentUserSettings.thumbnailQuality = 'high';
    await create();
    const button = sizeBlock().querySelector<HTMLButtonElement>('.thumbnail-size-info-button');
    const note = () => TestBed.inject(OverlayContainer).getContainerElement().querySelector('.thumbnail-size-note');
    const click = async (target: HTMLElement) => {
      target.click();
      await fixture.whenStable();
    };
    expect(button.previousElementSibling.classList).toContain('thumbnail-size-scale');
    expect([button.title, button.getAttribute('aria-label')]).toEqual(['About the thumbnail size', 'About the thumbnail size']);
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(note()).toBeNull();

    await click(button);
    expect(note().textContent).toBe('A larger size shows the thumbnails larger, but they take longer to make and more space in the thumbnail cache.');
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(button.getAttribute('aria-controls')).toBe(note().id);
    // A click on the note leaves it open.
    await click(note() as HTMLElement);
    expect(note()).not.toBeNull();

    await click(button);
    expect(note()).toBeNull();
    expect(button.getAttribute('aria-expanded')).toBe('false');

    await click(button);
    await click(element().querySelector('.setting-title'));
    expect(note()).toBeNull();

    await click(button);
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();
    expect(note()).toBeNull();
  });

  it('keeps the button of the note enabled while Fast is chosen, when the size\'s texts are faint', async () => {
    currentUserSettings.thumbnailQuality = 'fast';
    await create();
    expect(sizeBlock().querySelector<HTMLButtonElement>('.thumbnail-size-info-button').disabled).toBe(false);
  });

  it('tells the dialog of the size chosen with the slider, and shows it', async () => {
    currentUserSettings.thumbnailQuality = 'high';
    currentUserSettings.thumbnailSize = 400;
    await create();
    const changes = changesTold();

    await (await (await slider()).getEndThumb()).setValue(900);
    await fixture.whenStable();

    expect(changes.at(-1)).toEqual({ thumbnailQuality: 'high', thumbnailSize: 900 });
    expect(sizeBlock().querySelector('input').getAttribute('aria-valuetext')).toBe('900 pixels on the longer side');
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
    expect(Array.from(element().querySelectorAll('.setting-title'), title => title.textContent)).toEqual(['Thumbnail Quality and App Performance', 'Thumbnail Cache']);
    const cache = element().querySelector('app-cache-settings');
    expect(element().querySelector('mat-radio-group').compareDocumentPosition(cache) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(cache.querySelector('.delete-button').textContent.trim()).toBe('Delete Thumbnail Cache');
  });
});
