import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { DirectoryTreeViewDataService } from '../../directory-tree-view/directory-tree-view-data.service';
import { OpenFolderRecorder } from '../../sidebar/upper-pane/open-folder-recorder';
import { ThumbnailGenerationService } from '../../thumbnail-generation/service/thumbnail-generation.service';
import { OpenedDirectory } from '../opened-directory';
import { OpenFolderService } from './open-folder.service';
import { PhotoDataService } from './photo-data.service';

describe('OpenFolderService', () => {
  afterEach(() => vi.restoreAllMocks());

  it('gives the Live Photos movies of a folder when its tree replaces the one shown, not when the tree is read', async () => {
    // The opened folder is a stand-in here (test/angular/directory-double.ts). A row of the tree looks up its photo's
    // movie once it comes near the view, which may be while the next folder's photos are read: the previous folder's
    // rows are shown until its tree replaces them.
    const tree: DirectoryTree = { name: 'b', path: '/b', type: 'directory', children: [] };
    const livePhotos = { '/b/IMG_0002.JPG': '/b/IMG_0002.MOV' };
    vi.spyOn(OpenedDirectory, 'createDirectoryTree').mockResolvedValue({ tree, livePhotos });
    const setLivePhotos = vi.spyOn(OpenedDirectory, 'setLivePhotos').mockImplementation(() => {});
    const failed = vi.spyOn(OpenFolderRecorder, 'fail');
    let givenWhileRead: unknown[][] = [];
    let givenWhenReplaced: unknown[][] = [];
    TestBed.configureTestingModule({
      providers: [
        { provide: MatDialog, useValue: { open: () => ({ close: () => {} }) } },
        { provide: PhotoDataService, useValue: { update: async () => { givenWhileRead = [...setLivePhotos.mock.calls]; }, getPhotosWithGpsInfo: () => [{}] } },
        { provide: DirectoryTreeViewDataService, useValue: { replace: () => { givenWhenReplaced = [...setLivePhotos.mock.calls]; } } },
        { provide: ThumbnailGenerationService, useValue: { checkThumbnailCache: async () => ({}), startThumbnailGeneration: () => false } },
      ],
    });

    await TestBed.inject(OpenFolderService).open('/b');

    expect(failed).not.toHaveBeenCalled();
    expect(givenWhileRead).toEqual([]);
    expect(givenWhenReplaced).toEqual([[livePhotos]]);
  });
});
