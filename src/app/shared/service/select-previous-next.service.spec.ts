import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DirectoryTreeViewDataService } from '../../directory-tree-view/directory-tree-view-data.service';
import { DirectoryTreeViewSelectionService } from '../../directory-tree-view/directory-tree-view-selection.service';
import { NestedNode } from '../../directory-tree-view/directory-tree-view.model';
import { DateTimeOriginal } from '../model/date-time-original';
import { LatLng } from '../model/lat-lng.model';
import { Photo } from '../model/photo.model';
import { PhotoDataService } from './photo-data.service';
import { SelectPreviousNextService } from './select-previous-next.service';
import { SelectedPhotoService } from './selected-photo.service';

/** A photo of the opened folder: taken at `taken`, when it has DateTimeOriginal, and with a location unless not. */
interface PhotoFile {
  readonly taken?: Date;
  readonly modified?: Date;
  readonly location?: boolean;
}

describe('SelectPreviousNextService', () => {
  // The opened folder, as the tree view's data service and the photo data service give it.
  const tree = signal<readonly NestedNode[]>([]);
  const photos = signal(new Map<string, Photo>());
  let service: SelectPreviousNextService;
  let select: ReturnType<typeof vi.spyOn>;
  let updateMenus: ReturnType<typeof vi.spyOn>;

  function file(path: string, { taken, modified = new Date(2024, 0, 1), location = true }: PhotoFile = {}): NestedNode {
    return Object.assign(new NestedNode(), {
      name: path.slice(path.lastIndexOf('/') + 1), path, type: 'file', fsStats: { mtime: modified }, isSelectable: location, children: [],
    });
  }

  function folder(path: string, children: NestedNode[]): NestedNode {
    return Object.assign(new NestedNode(), {
      name: path.slice(path.lastIndexOf('/') + 1), path, type: 'directory', fsStats: { mtime: new Date(2024, 0, 1) },
      isSelectable: children.some(child => child.isSelectable), children,
    });
  }

  /** Opens a folder of these files, each a photo with its DateTimeOriginal and location as given. */
  function open(root: NestedNode, files: Record<string, PhotoFile>): void {
    photos.set(new Map(Object.entries(files).map(([path, { taken, location = true }]) => [path, Object.assign(new Photo(), {
      name: path.slice(path.lastIndexOf('/') + 1), path, filenameExtension: '.jpg',
      exif: { dateTimeOriginal: taken ? new DateTimeOriginal(taken) : undefined, gpsInfo: location ? { latLng: new LatLng(34.68, 135.19) } : undefined },
    })])));
    tree.set([root]);
  }

  /** The photo of a path of the opened folder, which the selection holds. */
  const photoAt = (path: string) => photos().get(path);

  /** From the first photo to the last, by Select Next, and back by Select Previous. */
  function walk(from: string): { forward: string[], backward: string[] } {
    const forward = [from];
    for (let next = service.nextOf(from); next !== null; next = service.nextOf(next)) forward.push(next);
    const last = forward[forward.length - 1];
    const backward = [last];
    for (let previous = service.previousOf(last); previous !== null; previous = service.previousOf(previous)) backward.push(previous);
    return { forward, backward };
  }

  beforeEach(() => {
    tree.set([]);
    photos.set(new Map());
    TestBed.configureTestingModule({
      providers: [
        { provide: DirectoryTreeViewDataService, useValue: { tree } },
        { provide: PhotoDataService, useValue: { getPhoto: (path: string) => photos().get(path) ?? null } },
      ],
    });
    select = vi.spyOn(TestBed.inject(DirectoryTreeViewSelectionService), 'select');
    updateMenus = vi.spyOn(window.plm.menus, 'updateSelectPreviousNext');
    service = TestBed.inject(SelectPreviousNextService);
  });

  it('goes through the photos in the order they were taken, across the subfolders, which the tree sorts each by itself', () => {
    open(folder('/trip', [
      folder('/trip/a day 2', [file('/trip/a day 2/IMG_0003.JPG'), file('/trip/a day 2/IMG_0004.JPG')]),
      folder('/trip/b day 1', [file('/trip/b day 1/IMG_0002.JPG'), file('/trip/b day 1/IMG_0001.JPG')]),
      file('/trip/z panorama.JPG'),
    ]), {
      '/trip/a day 2/IMG_0003.JPG': { taken: new Date(2019, 2, 17, 9, 0, 0) },
      '/trip/a day 2/IMG_0004.JPG': { taken: new Date(2019, 2, 17, 15, 0, 0) },
      '/trip/b day 1/IMG_0002.JPG': { taken: new Date(2019, 2, 16, 15, 0, 0) },
      '/trip/b day 1/IMG_0001.JPG': { taken: new Date(2019, 2, 16, 9, 0, 0) },
      '/trip/z panorama.JPG': { taken: new Date(2019, 2, 16, 12, 0, 0) },
    });

    expect(walk('/trip/b day 1/IMG_0001.JPG')).toEqual({
      forward: ['/trip/b day 1/IMG_0001.JPG', '/trip/z panorama.JPG', '/trip/b day 1/IMG_0002.JPG',
        '/trip/a day 2/IMG_0003.JPG', '/trip/a day 2/IMG_0004.JPG'],
      backward: ['/trip/a day 2/IMG_0004.JPG', '/trip/a day 2/IMG_0003.JPG', '/trip/b day 1/IMG_0002.JPG',
        '/trip/z panorama.JPG', '/trip/b day 1/IMG_0001.JPG'],
    });
    // No photo before the first or after the last: the order does not go round.
    expect(service.previousOf('/trip/b day 1/IMG_0001.JPG')).toBeNull();
    expect(service.nextOf('/trip/a day 2/IMG_0004.JPG')).toBeNull();
  });

  it('takes the file\'s modified time for a photo without DateTimeOriginal, as the tree\'s sort does', () => {
    open(folder('/photos', [
      file('/photos/a.jpg'),
      file('/photos/b.jpg', { modified: new Date(2019, 2, 16, 12, 0, 0) }),
      file('/photos/c.jpg'),
    ]), {
      '/photos/a.jpg': { taken: new Date(2019, 2, 16, 15, 0, 0) },
      '/photos/b.jpg': {},
      '/photos/c.jpg': { taken: new Date(2019, 2, 16, 9, 0, 0) },
    });

    expect(walk('/photos/c.jpg').forward).toEqual(['/photos/c.jpg', '/photos/b.jpg', '/photos/a.jpg']);
  });

  it('orders photos taken at the same time by name, as the tree does, then by path', () => {
    const burst = new Date(2019, 2, 16, 12, 0, 0);
    open(folder('/photos', [
      folder('/photos/copy', [file('/photos/copy/IMG_0001.JPG')]),
      file('/photos/IMG_0002.JPG'),
      file('/photos/img_0001.jpg'),
      file('/photos/IMG_0001.JPG'),
    ]), {
      '/photos/copy/IMG_0001.JPG': { taken: burst },
      '/photos/IMG_0002.JPG': { taken: burst },
      '/photos/img_0001.jpg': { taken: burst },
      '/photos/IMG_0001.JPG': { taken: burst },
    });

    // Three of the same name whatever the case: by path, in which "copy/" comes before the name, then by case.
    expect(service.previousOf('/photos/copy/IMG_0001.JPG')).toBeNull();
    expect(walk('/photos/copy/IMG_0001.JPG').forward)
      .toEqual(['/photos/copy/IMG_0001.JPG', '/photos/IMG_0001.JPG', '/photos/img_0001.jpg', '/photos/IMG_0002.JPG']);
  });

  it('leaves out the photos without location data, which cannot be selected', () => {
    open(folder('/photos', [
      file('/photos/a.jpg'),
      file('/photos/b.jpg', { location: false }),
      file('/photos/c.jpg'),
    ]), {
      '/photos/a.jpg': { taken: new Date(2019, 2, 16, 9, 0, 0) },
      '/photos/b.jpg': { taken: new Date(2019, 2, 16, 12, 0, 0), location: false },
      '/photos/c.jpg': { taken: new Date(2019, 2, 16, 15, 0, 0) },
    });

    expect(service.nextOf('/photos/a.jpg')).toBe('/photos/c.jpg');
    expect(service.previousOf('/photos/c.jpg')).toBe('/photos/a.jpg');
    expect(service.previousOf('/photos/b.jpg')).toBeNull();
    expect(service.nextOf('/photos/b.jpg')).toBeNull();
  });

  it('has neither for a single photo, for a folder without location data, and before a folder is opened', () => {
    expect(service.nextOf('/photos/a.jpg')).toBeNull();

    open(folder('/photos', [file('/photos/a.jpg')]), { '/photos/a.jpg': { taken: new Date(2019, 2, 16) } });
    expect(service.previousOf('/photos/a.jpg')).toBeNull();
    expect(service.nextOf('/photos/a.jpg')).toBeNull();

    open(folder('/photos', [file('/photos/a.jpg', { location: false }), file('/photos/b.jpg', { location: false })]), {
      '/photos/a.jpg': { taken: new Date(2019, 2, 16), location: false },
      '/photos/b.jpg': { taken: new Date(2019, 2, 17), location: false },
    });
    expect(service.nextOf('/photos/a.jpg')).toBeNull();
    expect(service.previousOf('/photos/b.jpg')).toBeNull();
  });

  it('goes through the photos of the folder that opened last', () => {
    open(folder('/first', [file('/first/a.jpg'), file('/first/b.jpg')]), {
      '/first/a.jpg': { taken: new Date(2019, 2, 16) }, '/first/b.jpg': { taken: new Date(2019, 2, 17) },
    });
    expect(service.nextOf('/first/a.jpg')).toBe('/first/b.jpg');

    open(folder('/second', [file('/second/a.jpg'), file('/second/b.jpg')]), {
      '/second/a.jpg': { taken: new Date(2019, 2, 17) }, '/second/b.jpg': { taken: new Date(2019, 2, 16) },
    });
    expect(service.nextOf('/first/a.jpg')).toBeNull();
    expect(service.nextOf('/second/b.jpg')).toBe('/second/a.jpg');
  });

  it('selects only the photo it is given, as Select Only This does', () => {
    service.select('/photos/b.jpg');

    expect(select).toHaveBeenCalledExactlyOnceWith(['/photos/b.jpg']);
  });

  describe('in the Selection menu', () => {
    const selectedPhotoService = () => TestBed.inject(SelectedPhotoService);

    beforeEach(() => open(folder('/photos', [file('/photos/a.jpg'), file('/photos/b.jpg'), file('/photos/c.jpg')]), {
      '/photos/a.jpg': { taken: new Date(2019, 2, 16, 9, 0, 0) },
      '/photos/b.jpg': { taken: new Date(2019, 2, 16, 12, 0, 0) },
      '/photos/c.jpg': { taken: new Date(2019, 2, 16, 15, 0, 0) },
    }));

    it('enables the items that apply to the one selected photo, and neither for none or several', () => {
      const menus = () => {
        TestBed.tick();
        return updateMenus.mock.lastCall?.[0];
      };
      expect(menus()).toEqual({ isSelectPreviousMenuEnabled: false, isSelectNextMenuEnabled: false });

      selectedPhotoService().setSelectedPhotos([photoAt('/photos/a.jpg')]);
      expect(menus()).toEqual({ isSelectPreviousMenuEnabled: false, isSelectNextMenuEnabled: true });
      selectedPhotoService().setSelectedPhotos([photoAt('/photos/b.jpg')]);
      expect(menus()).toEqual({ isSelectPreviousMenuEnabled: true, isSelectNextMenuEnabled: true });
      selectedPhotoService().setSelectedPhotos([photoAt('/photos/c.jpg')]);
      expect(menus()).toEqual({ isSelectPreviousMenuEnabled: true, isSelectNextMenuEnabled: false });
      selectedPhotoService().setSelectedPhotos([photoAt('/photos/a.jpg'), photoAt('/photos/c.jpg')]);
      expect(menus()).toEqual({ isSelectPreviousMenuEnabled: false, isSelectNextMenuEnabled: false });
      selectedPhotoService().setSelectedPhotos([]);
      expect(menus()).toEqual({ isSelectPreviousMenuEnabled: false, isSelectNextMenuEnabled: false });
    });

    it('tells the main process only of a change of what applies', () => {
      TestBed.tick();
      selectedPhotoService().setSelectedPhotos([photoAt('/photos/a.jpg'), photoAt('/photos/b.jpg')]);
      TestBed.tick();
      selectedPhotoService().setSelectedPhotos([photoAt('/photos/b.jpg')]);
      TestBed.tick();
      selectedPhotoService().setSelectedPhotos([photoAt('/photos/b.jpg'), photoAt('/photos/c.jpg')]);
      TestBed.tick();

      expect(updateMenus.mock.calls).toEqual([
        [{ isSelectPreviousMenuEnabled: false, isSelectNextMenuEnabled: false }],
        [{ isSelectPreviousMenuEnabled: true, isSelectNextMenuEnabled: true }],
        [{ isSelectPreviousMenuEnabled: false, isSelectNextMenuEnabled: false }],
      ]);
    });

    it('selects the photo taken just before or just after the one selected photo', () => {
      selectedPhotoService().setSelectedPhotos([photoAt('/photos/b.jpg')]);

      service.selectPreviousOfSelectedPhoto();
      service.selectNextOfSelectedPhoto();

      expect(select.mock.calls).toEqual([[['/photos/a.jpg']], [['/photos/c.jpg']]]);
    });

    it('leaves the selection as it is when the item does not apply to it any more', () => {
      selectedPhotoService().setSelectedPhotos([photoAt('/photos/a.jpg')]);
      service.selectPreviousOfSelectedPhoto();
      selectedPhotoService().setSelectedPhotos([photoAt('/photos/c.jpg')]);
      service.selectNextOfSelectedPhoto();
      selectedPhotoService().setSelectedPhotos([photoAt('/photos/a.jpg'), photoAt('/photos/b.jpg')]);
      service.selectPreviousOfSelectedPhoto();
      service.selectNextOfSelectedPhoto();

      expect(select).not.toHaveBeenCalled();
    });
  });
});
