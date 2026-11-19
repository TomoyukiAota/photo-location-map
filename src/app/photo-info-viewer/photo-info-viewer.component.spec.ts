import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';
import { Analytics } from '../../../src-shared/analytics/analytics';
import type { ThumbnailState } from '../../../src-shared/bridge/plm-bridge';
import { IconDataUrl } from '../../assets/icon-data-url';
import { DirectoryTreeViewSelectionService } from '../directory-tree-view/directory-tree-view-selection.service';
import { DateTimeOriginal } from '../shared/model/date-time-original';
import { Dimensions } from '../shared/model/dimensions.model';
import { Exif } from '../shared/model/exif.model';
import { LatLng } from '../shared/model/lat-lng.model';
import { Photo } from '../shared/model/photo.model';
import { NearViewDirective } from '../shared/near-view/near-view.directive';
import { Thumbnail } from '../shared/model/thumbnail.model';
import { OpenedDirectory } from '../shared/opened-directory';
import { PhotoRevealService } from '../shared/service/photo-reveal.service';
import { SelectPreviousNextService } from '../shared/service/select-previous-next.service';
import { GeneratedThumbnailService, thumbnailCheckIntervalMs } from './generated-thumbnail.service';
import { MoreOptionsMenuComponent } from './more-options-menu/more-options-menu.component';
import { PhotoInfoViewerComponent } from './photo-info-viewer.component';
import { PhotoInfoViewerPlace } from './photo-info-viewer-place';
import { ThumbnailRotationService } from './thumbnail-rotation.service';

/** A photo at a path, with the EXIF data given. */
function photoAt(path: string, exif?: Exif): Photo {
  const name = path.slice(path.lastIndexOf('/') + 1);
  return Object.assign(new Photo(), { name, path, filenameExtension: name.slice(name.lastIndexOf('.')).toLowerCase(), exif });
}

/** A JPEG photo as a camera writes it: with a thumbnail, a shooting time and a location. */
function cameraPhoto(path = '/photos/IMG_0001.JPG'): Photo {
  return photoAt(path, {
    thumbnail: new Thumbnail('blob:thumbnail-of-IMG_0001', new Dimensions(160, 120)),
    dateTimeOriginal: new DateTimeOriginal(new Date(2019, 2, 16, 17, 29, 58)),
    gpsInfo: { latLng: new LatLng(34.68, 135.19) },
  });
}

describe('PhotoInfoViewerComponent', () => {
  let fixture: ComponentFixture<PhotoInfoViewerComponent>;
  let element: HTMLElement;
  let livePhotos: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // The opened folder is a stand-in here (test/angular/directory-double.ts), which knows of no Live Photos.
    livePhotos = vi.spyOn(OpenedDirectory, 'getLivePhotosFilePathIfAvailable').mockReturnValue({ livePhotosAvailable: false, livePhotosFilePath: '' });
  });

  afterEach(() => livePhotos.mockRestore());

  async function show(photo: Photo, place: PhotoInfoViewerPlace): Promise<void> {
    fixture = TestBed.createComponent(PhotoInfoViewerComponent);
    fixture.componentRef.setInput('photo', photo);
    fixture.componentRef.setInput('place', place);
    element = fixture.nativeElement;
    await fixture.whenStable();
  }

  const thumbnail = () => element.querySelector<HTMLImageElement>('img.photo-info-viewer-thumbnail');
  /** The buttons under or beside the thumbnail, by their tooltips. */
  const buttons = () => Array.from(element.querySelectorAll<HTMLButtonElement>('.photo-info-viewer-lower-div > button'));
  const button = (title: string) => buttons().find(candidate => candidate.querySelector('img').title === title);
  async function click(target: HTMLElement): Promise<void> {
    target.click();
    await fixture.whenStable();
  }

  it('shows a photo\'s thumbnail, name, shooting time and buttons in a popup of the map', async () => {
    await show(cameraPhoto(), 'leaflet-map-popup');

    expect(element.getAttribute('data-place')).toBe('leaflet-map-popup');
    expect(thumbnail().getAttribute('src')).toBe('blob:thumbnail-of-IMG_0001');
    expect(thumbnail().getAttribute('loading')).toBe('lazy');
    expect(thumbnail().hasAttribute('alt')).toBe(false);
    expect(thumbnail().className).toBe('photo-info-viewer-thumbnail');
    expect(element.querySelector('.photo-info-viewer-name').textContent).toBe('IMG_0001.JPG');
    expect(element.querySelector('.photo-info-viewer-name').getAttribute('dir')).toBe('auto');
    expect(element.querySelector('.photo-info-viewer-date-time-taken').textContent).toBe('2019-03-16 Sat 17:29:58');
    expect(buttons().map(each => each.querySelector('img').title)).toEqual(['Rotate Thumbnail', 'Open File', 'More Options']);
    expect(buttons().map(each => each.querySelector('img').alt)).toEqual(['Rotate Thumbnail', 'Open File', 'More Options']);
    // The small button that turns a tile's thumbnail is for tiles only.
    expect(element.querySelector('.photo-info-viewer-rotate-button-in-thumbnail-container')).toBeNull();
  });

  it('shows the thumbnail, the shooting time and the buttons, without the name, in a row of the folder tree', async () => {
    await show(cameraPhoto(), 'dir-tree-view');

    expect(element.querySelector('.photo-info-viewer-name')).toBeNull();
    expect(element.querySelector('.photo-info-viewer-date-time-taken').textContent).toBe('2019-03-16 Sat 17:29:58');
    expect(element.querySelector('.photo-info-viewer-date-time-taken-unknown')).toBeNull();
    expect(buttons()).toHaveLength(3);
  });

  it('shows a tile of a cluster\'s popup with its date and time on two lines, a small button to turn it, and nothing else', async () => {
    await show(cameraPhoto(), 'leaflet-map-tile');

    expect(element.querySelector('.photo-info-viewer-name')).toBeNull();
    expect(element.querySelector('.photo-info-viewer-lower-div')).toBeNull();
    const lines = Array.from(element.querySelectorAll('.photo-info-viewer-date-time-taken > div'), line => line.textContent);
    expect(lines).toEqual(['2019-03-16 Sat', '17:29:58']);
    expect(element.querySelector<HTMLImageElement>('.photo-info-viewer-rotate-button-in-thumbnail-container > img').title).toBe('Rotate Thumbnail');
  });

  it('marks the shooting time of a photo that has none, which a row of the tree gives no room', async () => {
    await show(photoAt('/photos/drawing.png'), 'dir-tree-view');

    expect(element.querySelector('.photo-info-viewer-date-time-taken').textContent).toBe('');
    expect(element.querySelector('.photo-info-viewer-date-time-taken-unknown')).not.toBeNull();
  });

  describe('in a row of the folder tree that is not yet near what is shown', () => {
    /** Whether the row is near, as the row's NearViewDirective tells. */
    const near = signal(false);

    beforeEach(() => {
      near.set(false);
      TestBed.configureTestingModule({ providers: [{ provide: NearViewDirective, useValue: { isNear: near.asReadonly() } }] });
    });

    it('shows the shooting time with the room of the thumbnail and the buttons, and them once the row comes near', async () => {
      await show(cameraPhoto(), 'dir-tree-view');

      expect(element.querySelector('.photo-info-viewer-date-time-taken').textContent).toBe('2019-03-16 Sat 17:29:58');
      expect(element.querySelector('.photo-info-viewer-thumbnail-container')).not.toBeNull();
      expect(thumbnail()).toBeNull();
      expect(buttons()).toEqual([]);
      expect(element.querySelectorAll('.photo-info-viewer-lower-div > .photo-info-viewer-button-room')).toHaveLength(1);

      near.set(true);
      await fixture.whenStable();

      expect(thumbnail().getAttribute('src')).toBe('blob:thumbnail-of-IMG_0001');
      expect(buttons()).toHaveLength(3);
      expect(element.querySelector('.photo-info-viewer-button-room')).toBeNull();
      expect(element.querySelector('.photo-info-viewer-date-time-taken').textContent).toBe('2019-03-16 Sat 17:29:58');
    });

    it('marks the shooting time of a photo that has none, as the row does once it is near', async () => {
      await show(photoAt('/photos/drawing.png'), 'dir-tree-view');

      expect(element.querySelector('.photo-info-viewer-date-time-taken').textContent).toBe('');
      expect(element.querySelector('.photo-info-viewer-date-time-taken-unknown')).not.toBeNull();
    });
  });

  it('says that the information is unavailable for a photo without a path', async () => {
    await show(photoAt(''), 'leaflet-map-popup');

    expect(element.textContent.trim()).toBe('Photo information is unavailable.');
    expect(thumbnail()).toBeNull();
  });

  describe('thumbnail', () => {
    it('is the photo itself, where its EXIF data has no thumbnail and the page can show it', async () => {
      await show(photoAt('/photos/# 1/drawing #2.png'), 'leaflet-map-popup');

      // The whole path in one segment of the address, escaped, so that a # does not start a fragment.
      expect(thumbnail().getAttribute('src')).toBe(`plm-file://local/${encodeURIComponent('/photos/# 1/drawing #2.png')}`);
      expect(thumbnail().className).toBe('photo-info-viewer-thumbnail');
    });

    it('is an image that says so, for a photo that the page cannot show and that no thumbnail is made of', async () => {
      await show(photoAt('/photos/scan.tif'), 'leaflet-map-popup');

      expect(thumbnail().getAttribute('src')).toBe(IconDataUrl.noThumbnailAvailable);
      expect(thumbnail().classList.contains('photo-info-viewer-thumbnail-placeholder')).toBe(true);
      expect(thumbnail().classList.contains('photo-info-viewer-generating-thumbnail')).toBe(false);
    });

    describe('of a HEIF photo, which the main process makes', () => {
      let finished: boolean;

      beforeEach(() => {
        vi.useFakeTimers();
        finished = false;
        vi.spyOn(window.plm.thumbnails, 'state').mockImplementation(async photoPaths => photoPaths.map((photoPath): ThumbnailState =>
          ({ attemptFinished: finished, cacheAvailable: finished, thumbnailFilePath: `/cache${photoPath}.plm.jpg` })));
      });

      afterEach(() => vi.useRealTimers());

      /** Lets the timers of this long run, then renders what they changed. */
      async function pass(milliseconds: number): Promise<void> {
        await vi.advanceTimersByTimeAsync(milliseconds);
        fixture.detectChanges();
      }

      async function showHeifPhoto(): Promise<void> {
        fixture = TestBed.createComponent(PhotoInfoViewerComponent);
        fixture.componentRef.setInput('photo', photoAt('/photos/IMG_0002.HEIC'));
        fixture.componentRef.setInput('place', 'dir-tree-view');
        element = fixture.nativeElement;
        fixture.detectChanges();
      }

      it('is an image that flickers while the thumbnail is being made, then the thumbnail, which fades in once', async () => {
        await showHeifPhoto();
        await pass(0);
        expect(thumbnail().getAttribute('src')).toBe(IconDataUrl.generatingThumbnail);
        expect(thumbnail().classList.contains('photo-info-viewer-generating-thumbnail')).toBe(true);
        expect(thumbnail().classList.contains('photo-info-viewer-thumbnail-placeholder')).toBe(true);

        finished = true;
        await pass(thumbnailCheckIntervalMs);
        expect(thumbnail().getAttribute('src')).toBe(`plm-file://local/${encodeURIComponent('/cache/photos/IMG_0002.HEIC.plm.jpg')}`);
        expect(thumbnail().className).toBe('photo-info-viewer-thumbnail photo-info-viewer-fade-in-after-thumbnail-generation');

        // The class goes once the animation is over, so that the thumbnail does not fade in again in a popup that is
        // opened again.
        await pass(2499);
        expect(thumbnail().classList.contains('photo-info-viewer-fade-in-after-thumbnail-generation')).toBe(true);
        await pass(1);
        expect(thumbnail().className).toBe('photo-info-viewer-thumbnail');
      });

      it('is the thumbnail at once, without fading in, when it is known already', async () => {
        finished = true;
        TestBed.inject(GeneratedThumbnailService).watch('/photos/IMG_0002.HEIC');
        await vi.advanceTimersByTimeAsync(0);

        await showHeifPhoto();

        expect(thumbnail().getAttribute('src')).toBe(`plm-file://local/${encodeURIComponent('/cache/photos/IMG_0002.HEIC.plm.jpg')}`);
        expect(thumbnail().className).toBe('photo-info-viewer-thumbnail');
      });
    });
  });

  describe('buttons', () => {
    it('turn the thumbnail by a quarter for each click, in this place only', async () => {
      await show(cameraPhoto(), 'leaflet-map-popup');
      expect(thumbnail().style.transform).toBe('');

      await click(button('Rotate Thumbnail'));
      expect(thumbnail().style.transform).toBe('rotate(90deg)');
      await click(button('Rotate Thumbnail'));
      expect(thumbnail().style.transform).toBe('rotate(180deg)');

      const rotations = TestBed.inject(ThumbnailRotationService);
      expect(rotations.degreesOf('leaflet-map-popup', '/photos/IMG_0001.JPG')).toBe(180);
      expect(rotations.degreesOf('dir-tree-view', '/photos/IMG_0001.JPG')).toBe(0);
    });

    it('show the thumbnail as it was turned before this component was made', async () => {
      TestBed.inject(ThumbnailRotationService).rotate('dir-tree-view', '/photos/IMG_0001.JPG');

      await show(cameraPhoto(), 'dir-tree-view');

      expect(thumbnail().style.transform).toBe('rotate(90deg)');
    });

    it('open the photo with the OS, from the Open File button and from the thumbnail', async () => {
      const open = vi.spyOn(window.plm.shell, 'openWithAssociatedApp');
      await show(cameraPhoto(), 'leaflet-map-popup');

      await click(button('Open File'));
      await click(thumbnail());

      expect(open.mock.calls).toEqual([['/photos/IMG_0001.JPG'], ['/photos/IMG_0001.JPG']]);
    });

    it('play the movie of the photo\'s Live Photos, for a photo that has one', async () => {
      livePhotos.mockReturnValue({ livePhotosAvailable: true, livePhotosFilePath: '/photos/IMG_0001.MOV' });
      const open = vi.spyOn(window.plm.shell, 'openWithAssociatedApp');
      await show(cameraPhoto(), 'dir-tree-view');
      expect(buttons().map(each => each.querySelector('img').title)).toEqual(['Rotate Thumbnail', 'Open File', 'Live Photos', 'More Options']);

      await click(button('Live Photos'));

      expect(open).toHaveBeenCalledExactlyOnceWith('/photos/IMG_0001.MOV');
    });

    it('keep their clicks from what is around them, as a row of the tree, which a click on the thumbnail reaches', async () => {
      await show(cameraPhoto(), 'dir-tree-view');
      const heardAround: string[] = [];
      element.addEventListener('click', event => heardAround.push((event.target as HTMLElement).className));

      for (const each of buttons())
        each.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      thumbnail().dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(heardAround).toEqual(['photo-info-viewer-thumbnail']);
    });
  });

  describe('in a tile', () => {
    it('leaves a click on the thumbnail to the tile, which the click chooses, without opening the photo', async () => {
      const open = vi.spyOn(window.plm.shell, 'openWithAssociatedApp');
      await show(cameraPhoto(), 'leaflet-map-tile');
      const heardByTile = vi.fn();
      element.addEventListener('click', heardByTile);

      await click(thumbnail());

      expect(open).not.toHaveBeenCalled();
      expect(heardByTile).toHaveBeenCalledTimes(1);
    });

    it('turns the thumbnail with the small button, without a click for the tile', async () => {
      await show(cameraPhoto(), 'leaflet-map-tile');
      const heardByTile = vi.fn();
      element.addEventListener('click', heardByTile);

      await click(element.querySelector('.photo-info-viewer-rotate-button-in-thumbnail-container'));

      expect(thumbnail().style.transform).toBe('rotate(90deg)');
      expect(heardByTile).not.toHaveBeenCalled();
    });
  });

  describe('More Options menu', () => {
    let menuFixture: ComponentFixture<MoreOptionsMenuComponent> | undefined;

    beforeEach(() => {
      menuFixture = undefined;
      // The menus open and close at once, rather than after an animation that jsdom never runs.
      TestBed.configureTestingModule({ providers: [{ provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } }] });
    });

    /** The photo's viewer, with the menu that the home view has for every photo, which its button opens. */
    async function showWithMenu(photo: Photo, place: PhotoInfoViewerPlace): Promise<void> {
      if (!menuFixture) {
        menuFixture = TestBed.createComponent(MoreOptionsMenuComponent);
        await menuFixture.whenStable();
      }
      await show(photo, place);
    }

    /** The open menus, above the page in the overlay container: the menu, and a submenu while one is open. */
    const menus = () => Array.from(document.querySelectorAll<HTMLElement>('.cdk-overlay-container .photo-info-viewer-more-options-menu'));
    const itemsOf = (menu: HTMLElement) => Array.from(menu.querySelectorAll<HTMLButtonElement>('.photo-info-viewer-more-options-menu-item'));
    const textsOf = (menu: HTMLElement) => itemsOf(menu).map(item => item.textContent.trim());
    const item = (menu: HTMLElement, text: string) => itemsOf(menu).find(candidate => candidate.textContent.trim() === text);
    /** Once the menus have closed: the menu's content goes once it has closed, after a timeout. */
    const closed = () => vi.waitFor(() => expect(menus()).toEqual([]));

    /** Opens the menu, and the submenu of the item `submenu` if one is given; the menu that is then on top. */
    async function open(submenu?: string): Promise<HTMLElement> {
      await click(button('More Options'));
      if (submenu)
        await click(item(menus()[0], submenu));
      return menus().at(-1);
    }

    it('opens above the page, with what can be done with a photo that has a location, and the submenus of Selection and Google', async () => {
      await showWithMenu(cameraPhoto(), 'leaflet-map-popup');
      expect(menus()).toEqual([]);
      expect(button('More Options').getAttribute('aria-haspopup')).toBe('menu');
      expect(button('More Options').getAttribute('aria-expanded')).toBe('false');

      const menu = await open();

      expect(element.contains(menu)).toBe(false);
      expect(menu.getAttribute('role')).toBe('menu');
      expect(button('More Options').getAttribute('aria-expanded')).toBe('true');
      expect(textsOf(menu)).toEqual(['Selection', 'Reveal in Sidebar', 'Open Folder', 'Google', 'View Data']);
      expect(itemsOf(menu).map(each => each.getAttribute('aria-haspopup'))).toEqual(['menu', null, null, 'menu', null]);
      await click(item(menu, 'Selection'));
      expect(menus()).toHaveLength(2);
      expect(textsOf(menus()[1])).toEqual(['Select Only This', 'Select Previous', 'Select Next']);
      // The pointer on another item closes the submenu, and opens that item's submenu.
      item(menu, 'Google').dispatchEvent(new MouseEvent('mouseenter'));
      await vi.waitFor(() => expect(menus().map(textsOf)).toEqual([
        ['Selection', 'Reveal in Sidebar', 'Open Folder', 'Google', 'View Data'],
        ['Open Google Maps', 'Open Google Earth', 'Open Google Street View'],
      ]));
    });

    it('shows a photo of a row of the folder tree on the map, rather than in the sidebar', async () => {
      const revealInMap = vi.spyOn(TestBed.inject(PhotoRevealService), 'revealInMap').mockImplementation(() => undefined);
      await showWithMenu(cameraPhoto(), 'dir-tree-view');

      const menu = await open();

      expect(textsOf(menu)).toEqual(['Selection', 'Reveal in Map', 'Open Folder', 'Google', 'View Data']);
      await click(item(menu, 'Reveal in Map'));
      expect(revealInMap).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ path: '/photos/IMG_0001.JPG' }));
      await closed();
    });

    it('has Select Previous and Select Next in Selection, which select the photo taken before or after, and cannot be chosen where there is none', async () => {
      // The photos taken just before and after, which SelectPreviousNextService has tests of its own for.
      const neighbors: Record<string, [string | null, string | null]> = {
        '/photos/IMG_0001.JPG': [null, '/photos/IMG_0002.JPG'],
        '/photos/IMG_0002.JPG': ['/photos/IMG_0001.JPG', '/photos/IMG_0003.JPG'],
        '/photos/IMG_0003.JPG': ['/photos/IMG_0002.JPG', null],
      };
      const select = vi.fn();
      TestBed.overrideProvider(SelectPreviousNextService, { useValue: {
        previousOf: (path: string) => neighbors[path]?.[0] ?? null,
        nextOf: (path: string) => neighbors[path]?.[1] ?? null,
        select,
      } });
      /** Which of the items of Selection can be chosen, for the photo. */
      const choosable = async (path: string) => {
        await showWithMenu(cameraPhoto(path), 'dir-tree-view');
        const selection = await open('Selection');
        const result = Object.fromEntries(itemsOf(selection).map(each => [each.textContent.trim(), !each.disabled]));
        document.body.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
        await closed();
        return result;
      };

      expect(await choosable('/photos/IMG_0001.JPG')).toEqual({ 'Select Only This': true, 'Select Previous': false, 'Select Next': true });
      expect(await choosable('/photos/IMG_0003.JPG')).toEqual({ 'Select Only This': true, 'Select Previous': true, 'Select Next': false });
      expect(await choosable('/photos/IMG_0002.JPG')).toEqual({ 'Select Only This': true, 'Select Previous': true, 'Select Next': true });
      for (const text of ['Select Previous', 'Select Next']) {
        await click(item(await open('Selection'), text));
        await closed();
      }

      expect(select.mock.calls).toEqual([['/photos/IMG_0001.JPG'], ['/photos/IMG_0003.JPG']]);
    });

    it('has no item that needs a location for a photo without one', async () => {
      await showWithMenu(photoAt('/photos/drawing.png'), 'dir-tree-view');

      expect(textsOf(await open())).toEqual(['Open Folder', 'View Data']);
    });

    it('closes when its button is clicked again, and when the pointer is pressed or the wheel turned elsewhere, and not in itself', async () => {
      await showWithMenu(cameraPhoto(), 'leaflet-map-popup');
      document.body.appendChild(element);
      try {
        await open();
        await click(button('More Options'));
        await closed();

        // What is pressed then is pressed too: nothing takes the press, which goes on to it.
        const heard = vi.fn();
        document.body.addEventListener('pointerdown', heard, { once: true });
        const menu = await open('Selection');
        menu.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
        menus()[0].dispatchEvent(new Event('wheel', { bubbles: true }));
        expect(menus()).toHaveLength(2);
        document.body.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
        expect(heard).toHaveBeenCalledOnce();
        await closed();

        await open();
        element.dispatchEvent(new Event('wheel', { bubbles: true }));
        await closed();
      } finally {
        element.remove();
      }
    });

    it('does what its items say, closes, and gives its button the focus back', async () => {
      const select = vi.spyOn(TestBed.inject(DirectoryTreeViewSelectionService), 'select');
      const openContainingFolder = vi.spyOn(window.plm.shell, 'openContainingFolder');
      const openExternal = vi.spyOn(window.plm.shell, 'openExternal');
      const openPhotoDataViewer = vi.spyOn(window.plm.photoDataViewer, 'open');
      const revealInSidebar = vi.spyOn(TestBed.inject(PhotoRevealService), 'revealInSidebar');
      await showWithMenu(cameraPhoto(), 'leaflet-map-popup');
      document.body.appendChild(element);
      try {
        for (const [submenu, text] of [
          ['Selection', 'Select Only This'], [undefined, 'Reveal in Sidebar'], [undefined, 'Open Folder'],
          ['Google', 'Open Google Maps'], ['Google', 'Open Google Earth'], ['Google', 'Open Google Street View'], [undefined, 'View Data'],
        ] as const) {
          button('More Options').focus();
          await click(item(await open(submenu), text));
          await closed();
          expect(document.activeElement).toBe(button('More Options'));
        }
      } finally {
        element.remove();
      }

      expect(select).toHaveBeenCalledExactlyOnceWith(['/photos/IMG_0001.JPG']);
      expect(revealInSidebar).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ path: '/photos/IMG_0001.JPG' }));
      expect(openContainingFolder).toHaveBeenCalledExactlyOnceWith('/photos/IMG_0001.JPG');
      expect(openExternal.mock.calls).toEqual([
        ['https://maps.google.com/?q=34.68,135.19&ll=34.68,135.19&z=14'],
        ['https://earth.google.com/web/search/34.68,135.19'],
        ['https://www.google.com/maps/@?api=1&map_action=pano&parameters&viewpoint=34.68,135.19'],
      ]);
      expect(openPhotoDataViewer).toHaveBeenCalledExactlyOnceWith({ photo: { name: 'IMG_0001.JPG', path: '/photos/IMG_0001.JPG' } });
    });

    it('tells the analytics which of Google\'s sites its items open, without the photo\'s place', async () => {
      await showWithMenu(cameraPhoto(), 'leaflet-map-popup');
      const trackEvent = vi.spyOn(Analytics, 'trackEvent');
      try {
        for (const text of ['Open Google Maps', 'Open Google Earth', 'Open Google Street View']) {
          await click(item(await open('Google'), text));
          await closed();
        }

        expect(trackEvent.mock.calls).toEqual([
          ['Photo Info Viewer', '[PIV] Clicked "Open Google Maps"'],
          ['Opened URL', 'Opened URL', '[Photo Info Viewer] Opened URL for "Open Google Maps" Menu Item',
            'https://maps.google.com/ with query parameters for latitude, longitude, and zoom'],
          ['Photo Info Viewer', '[PIV] Clicked "Open Google Earth"'],
          ['Opened URL', 'Opened URL', '[Photo Info Viewer] Opened URL for "Open Google Earth" Menu Item',
            'https://earth.google.com/web/search/ with latitude and longitude'],
          ['Photo Info Viewer', '[PIV] Clicked "Open Google Street View"'],
          ['Opened URL', 'Opened URL', '[Photo Info Viewer] Opened URL for "Open Google Street View" Menu Item',
            'https://www.google.com/maps/ with query parameters for latitude, longitude'],
        ]);
        expect(JSON.stringify(trackEvent.mock.calls)).not.toMatch(/34\.68|135\.19/);
      } finally {
        trackEvent.mockRestore();
      }
    });
  });
});
