import { TestBed } from '@angular/core/testing';
import { UserDataStorage } from '../../../../src-shared/user-data-storage/user-data-storage';
import { UserDataStoragePath } from '../../../../src-shared/user-data-storage/user-data-stroage-path';
import { DateTimeOriginal } from '../../shared/model/date-time-original';
import { Photo } from '../../shared/model/photo.model';
import { PhotoDataService } from '../../shared/service/photo-data.service';
import { NestedNode } from '../directory-tree-view.model';
import { DirTreeViewSortConfig } from './dir-tree-view-sort-config';
import { DirTreeViewSortService } from './dir-tree-view-sort.service';

// UserDataStorage is the in-memory double of test/angular/storage-double.ts here, emptied before each test.
describe('DirTreeViewSortService', () => {
  const sortKeyPath = UserDataStoragePath.DirectoryTreeView.SortKey;
  const sortDirectionPath = UserDataStoragePath.DirectoryTreeView.SortDirection;

  beforeEach(() => TestBed.configureTestingModule({}));

  it('starts by name, ascending, when nothing is saved, and saves nothing at startup', () => {
    const service = TestBed.inject(DirTreeViewSortService);

    expect(service.sortConfig()).toEqual({ key: 'Name', direction: 'Ascending' });
    expect(() => UserDataStorage.read(sortKeyPath)).toThrow();
    expect(() => UserDataStorage.read(sortDirectionPath)).toThrow();
  });

  it('starts from the saved sort key and direction', () => {
    UserDataStorage.write(sortKeyPath, 'ShootingTime');
    UserDataStorage.write(sortDirectionPath, 'Descending');

    const service = TestBed.inject(DirTreeViewSortService);

    expect(service.sortKey()).toBe('ShootingTime');
    expect(service.sortDirection()).toBe('Descending');
    expect(service.sortConfig()).toEqual({ key: 'ShootingTime', direction: 'Descending' });
  });

  it('updates the sort config and saves each choice', () => {
    const service = TestBed.inject(DirTreeViewSortService);

    service.setSortKey('ShootingTime');
    expect(service.sortConfig()).toEqual({ key: 'ShootingTime', direction: 'Ascending' });
    expect(UserDataStorage.read(sortKeyPath)).toBe('ShootingTime');

    service.setSortDirection('Descending');
    expect(service.sortConfig()).toEqual({ key: 'ShootingTime', direction: 'Descending' });
    expect(UserDataStorage.read(sortDirectionPath)).toBe('Descending');
  });

  describe('by date taken', () => {
    /** The photos of the folder, by path, which give the files with a DateTimeOriginal their shooting times. */
    const photos = new Map<string, Photo>();

    /** A file of the folder, modified at `modified`, and a photo taken at `taken` when that is given. */
    function file(name: string, modified: Date, taken?: Date): NestedNode {
      const path = `/photos/${name}`;
      if (taken)
        photos.set(path, Object.assign(new Photo(), { name, path, filenameExtension: '.jpg', exif: { dateTimeOriginal: new DateTimeOriginal(taken) } }));
      return Object.assign(new NestedNode(), { name, path, type: 'file', fsStats: { mtime: modified }, isSelectable: true, children: [] });
    }

    function sortedNames(children: NestedNode[], direction: 'Ascending' | 'Descending'): string[] {
      const folder = Object.assign(new NestedNode(), { name: 'photos', path: '/photos', type: 'directory', isSelectable: true, children });
      const service = TestBed.inject(DirTreeViewSortService);
      service.sortData([folder], new DirTreeViewSortConfig('ShootingTime', direction));
      return folder.children.map(child => child.name);
    }

    beforeEach(() => {
      photos.clear();
      TestBed.configureTestingModule({ providers: [{ provide: PhotoDataService, useValue: { getPhoto: (path: string) => photos.get(path) ?? null } }] });
    });

    it('orders the files by DateTimeOriginal, else by their modified time, and those taken at the same time by name', () => {
      const children = [
        file('d.jpg', new Date(2020, 0, 1), new Date(2015, 0, 1, 12, 0, 0)),
        file('b.jpg', new Date(2020, 0, 1), new Date(2013, 0, 1, 12, 0, 0)),
        // Taken at the same second as b.jpg, as in a burst.
        file('A.jpg', new Date(2020, 0, 1), new Date(2013, 0, 1, 12, 0, 0)),
        // Without DateTimeOriginal: modified between the two times above.
        file('c.mov', new Date(2014, 0, 1)),
      ];

      expect(sortedNames(children, 'Ascending')).toEqual(['A.jpg', 'b.jpg', 'c.mov', 'd.jpg']);
      // Descending is the reverse, the files taken at the same time too.
      expect(sortedNames(children, 'Descending')).toEqual(['d.jpg', 'c.mov', 'b.jpg', 'A.jpg']);
    });
  });
});
