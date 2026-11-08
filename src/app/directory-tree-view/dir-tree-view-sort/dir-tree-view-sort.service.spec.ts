import { TestBed } from '@angular/core/testing';
import { UserDataStorage } from '../../../../src-shared/user-data-storage/user-data-storage';
import { UserDataStoragePath } from '../../../../src-shared/user-data-storage/user-data-stroage-path';
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
});
