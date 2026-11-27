import { OverlayContainer } from '@angular/cdk/overlay';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSliderHarness } from '@angular/material/slider/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ThumbnailSizePlace, thumbnailSizePlaces } from '../../../../src-shared/user-settings/thumbnail-size';
import { currentUserSettings } from '../../../../src-shared/user-settings/user-settings';
import { SettingsChangedService } from '../service/settings-changed.service';
import { ThumbnailSettingsChangedParameter } from './thumbnail-settings-changed-parameter';
import { ThumbnailSettingsComponent } from './thumbnail-settings.component';

describe('ThumbnailSettingsComponent', () => {
  let fixture: ComponentFixture<ThumbnailSettingsComponent>;
  const element = () => fixture.nativeElement as HTMLElement;
  const choices = () => Array.from(element().querySelectorAll<HTMLElement>('mat-radio-button'));
  const sizeBlock = () => element().querySelector<HTMLElement>('.thumbnail-size');
  /** The scale of a place's size: its slider, with some of the sizes under it. */
  const scale = (place: ThumbnailSizePlace) => sizeBlock().querySelector<HTMLElement>(`.thumbnail-size-scale[data-size-place="${place}"]`);
  /** The sliders of the sizes, the sidebar's and then the map's. */
  const sliders = () => TestbedHarnessEnvironment.loader(fixture).getAllHarnesses(MatSliderHarness);
  let saved: Pick<typeof currentUserSettings, 'thumbnailQuality' | 'sidebarThumbnailSize' | 'mapThumbnailSize'>;

  beforeEach(async () => {
    const { thumbnailQuality, sidebarThumbnailSize, mapThumbnailSize } = currentUserSettings;
    saved = { thumbnailQuality, sidebarThumbnailSize, mapThumbnailSize };
    await TestBed.configureTestingModule({ imports: [ThumbnailSettingsComponent] }).compileComponents();
  });

  afterEach(() => Object.assign(currentUserSettings, saved));

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

  it('tells the dialog of the quality chosen, with the sizes, which the dialog saves', async () => {
    Object.assign(currentUserSettings, { thumbnailQuality: 'high', sidebarThumbnailSize: 600, mapThumbnailSize: 800 });
    await create();
    const changes = changesTold();

    choices()[1].querySelector('input').click();
    await fixture.whenStable();

    expect(changes).toEqual([{ thumbnailQuality: 'fast', sidebarThumbnailSize: 600, mapThumbnailSize: 800 }]);
    expect(currentUserSettings.thumbnailQuality).toBe('high');
  });

  it('has a slider for the sidebar\'s size and one for the map\'s right under High quality, from 400 to 2,000 pixels in steps of 100, at the sizes in use', async () => {
    Object.assign(currentUserSettings, { thumbnailQuality: 'high', sidebarThumbnailSize: 500, mapThumbnailSize: 700 });
    await create();

    expect(choices()[0].nextElementSibling).toBe(sizeBlock());
    expect(sizeBlock().querySelector('.thumbnail-size-label').textContent).toBe('Thumbnail size');
    expect(Array.from(sizeBlock().querySelectorAll('.thumbnail-size-place'), place => place.textContent)).toEqual(['Sidebar', 'Map']);
    // A screen reader reads each slider as the heading of the sizes and its place's name, and its size as a sentence.
    const readAs = (place: ThumbnailSizePlace) => {
      const input = scale(place).querySelector('input');
      const names = input.getAttribute('aria-labelledby').split(' ').map(id => element().querySelector(`#${id}`).textContent);
      return [...names, input.getAttribute('aria-valuetext')];
    };
    expect(readAs('sidebar')).toEqual(['Thumbnail size', 'Sidebar', '500 pixels on the longer side']);
    expect(readAs('map')).toEqual(['Thumbnail size', 'Map', '700 pixels on the longer side']);

    const harnesses = await sliders();
    expect(harnesses.length).toBe(2);
    for (const harness of harnesses) {
      expect([await harness.getMinValue(), await harness.getMaxValue(), await harness.getStep()]).toEqual([400, 2000, 100]);
      expect(await harness.isDisabled()).toBe(false);
    }
    expect(await Promise.all(harnesses.map(async harness => (await harness.getEndThumb()).getValue()))).toEqual([500, 700]);
  });

  it('writes the first size, the last, and every other one between them under each slider', async () => {
    await create();
    for (const place of thumbnailSizePlaces) {
      const ticks = Array.from(scale(place).querySelectorAll('.thumbnail-size-tick'), tick => tick.textContent);
      expect(ticks).toEqual(['400 px', '600 px', '800 px', '1000 px', '1200 px', '1400 px', '1600 px', '1800 px', '2000 px']);
      expect(scale(place).querySelector('.thumbnail-size-ticks').getAttribute('aria-hidden')).toBe('true');
    }
  });

  it('opens the note on the sizes with the button at the end of their heading, which closes it as a click elsewhere and Escape do', async () => {
    currentUserSettings.thumbnailQuality = 'high';
    await create();
    const button = sizeBlock().querySelector<HTMLButtonElement>('.thumbnail-size-info-button');
    const note = () => TestBed.inject(OverlayContainer).getContainerElement().querySelector('.thumbnail-size-note');
    const click = async (target: HTMLElement) => {
      target.click();
      await fixture.whenStable();
    };
    expect(button.parentElement.classList).toContain('thumbnail-size-heading');
    expect(button.previousElementSibling.classList).toContain('thumbnail-size-label');
    expect([button.title, button.getAttribute('aria-label')]).toEqual(['About the thumbnail size', 'About the thumbnail size']);
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(note()).toBeNull();

    await click(button);
    expect(note().textContent).toBe('The sidebar and the map show the thumbnails at their own sizes, and the app makes one thumbnail of each photo, at '
      + 'the larger of the two. A larger size shows the thumbnails larger, but they take longer to make and more space in the thumbnail cache.');
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

  it('keeps the button of the note enabled while Fast is chosen, when the sizes\' texts are faint', async () => {
    currentUserSettings.thumbnailQuality = 'fast';
    await create();
    expect(sizeBlock().querySelector<HTMLButtonElement>('.thumbnail-size-info-button').disabled).toBe(false);
  });

  it('tells the dialog of the size chosen with each slider, and shows it', async () => {
    Object.assign(currentUserSettings, { thumbnailQuality: 'high', sidebarThumbnailSize: 400, mapThumbnailSize: 400 });
    await create();
    const changes = changesTold();
    const [sidebar, map] = await sliders();

    await (await sidebar.getEndThumb()).setValue(2000);
    await fixture.whenStable();
    expect(changes.at(-1)).toEqual({ thumbnailQuality: 'high', sidebarThumbnailSize: 2000, mapThumbnailSize: 400 });

    await (await map.getEndThumb()).setValue(900);
    await fixture.whenStable();
    expect(changes.at(-1)).toEqual({ thumbnailQuality: 'high', sidebarThumbnailSize: 2000, mapThumbnailSize: 900 });

    expect(scale('sidebar').querySelector('input').getAttribute('aria-valuetext')).toBe('2000 pixels on the longer side');
    expect(scale('map').querySelector('input').getAttribute('aria-valuetext')).toBe('900 pixels on the longer side');
    expect([currentUserSettings.sidebarThumbnailSize, currentUserSettings.mapThumbnailSize]).toEqual([400, 400]);
  });

  it('keeps the quality chosen when a slider\'s input fires its change event, which bubbles to the radio group', async () => {
    Object.assign(currentUserSettings, { thumbnailQuality: 'high', sidebarThumbnailSize: 400, mapThumbnailSize: 400 });
    await create();
    const changes = changesTold();

    // As a pointer or Playwright's fill() leaves it: an input event, then a change event that bubbles.
    const input = scale('map').querySelector<HTMLInputElement>('input');
    input.value = '800';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await fixture.whenStable();

    expect(changes.length).toBeGreaterThan(0);
    expect(changes.every(change => change.thumbnailQuality === 'high')).toBe(true);
    expect(changes.at(-1)).toEqual({ thumbnailQuality: 'high', sidebarThumbnailSize: 400, mapThumbnailSize: 800 });
  });

  it('disables both sliders while Fast is chosen, which shows the thumbnails that the photos hold', async () => {
    currentUserSettings.thumbnailQuality = 'fast';
    await create();
    const disabled = async () => Promise.all((await sliders()).map(harness => harness.isDisabled()));
    expect(await disabled()).toEqual([true, true]);
    expect(sizeBlock().classList).toContain('thumbnail-size-disabled');

    choices()[0].querySelector('input').click();
    await fixture.whenStable();
    expect(await disabled()).toEqual([false, false]);
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
