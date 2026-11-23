import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { DirectoryTreeViewDataService } from '../../directory-tree-view/directory-tree-view-data.service';
import {
  LoadingFolderProgressReporterService,
  LoadingFolderProgressStatus,
} from '../../loading-folder/progress-reporter/loading-folder-progress-reporter.service';
import { OpenFolderRecorder } from '../../sidebar/upper-pane/open-folder-recorder';
import { ThumbnailGenerationService } from '../../thumbnail-generation/service/thumbnail-generation.service';
import { LoadingFolderProgress } from '../loading-folder-progress';
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
        {
          provide: PhotoDataService,
          useValue: { update: async () => { givenWhileRead = [...setLivePhotos.mock.calls]; }, getPhotosWithGpsInfo: () => [{}], getAllPhotos: () => [] },
        },
        { provide: DirectoryTreeViewDataService, useValue: { replace: () => { givenWhenReplaced = [...setLivePhotos.mock.calls]; } } },
        { provide: ThumbnailGenerationService, useValue: { checkThumbnailCache: async () => ({}), startThumbnailGeneration: () => false } },
      ],
    });

    await TestBed.inject(OpenFolderService).open('/b');

    expect(failed).not.toHaveBeenCalled();
    expect(givenWhileRead).toEqual([]);
    expect(givenWhenReplaced).toEqual([[livePhotos]]);
  });

  it('has the loading dialog say that loading completed before it closes the dialog, however soon the photos were read', async () => {
    // The dialog's component, which reports the progress every 100 ms, is not made here: the open reports it itself.
    const tree: DirectoryTree = { name: 'b', path: '/b', type: 'directory', children: [] };
    vi.spyOn(OpenedDirectory, 'createDirectoryTree').mockResolvedValue({ tree, livePhotos: {} });
    vi.spyOn(OpenedDirectory, 'setLivePhotos').mockImplementation(() => {});
    let statusWhenClosed: LoadingFolderProgressStatus | undefined;
    TestBed.configureTestingModule({
      providers: [
        { provide: MatDialog, useValue: { open: () => ({ close: () => { statusWhenClosed = TestBed.inject(LoadingFolderProgressReporterService).status(); } }) } },
        {
          provide: PhotoDataService, useValue: {
            update: async () => {
              LoadingFolderProgress.setNumberOfAllFilesToLoad(2);
              LoadingFolderProgress.incrementNumberOfLoadedFiles();
              LoadingFolderProgress.incrementNumberOfLoadedFiles();
            },
            getPhotosWithGpsInfo: () => [{}],
          },
        },
        { provide: DirectoryTreeViewDataService, useValue: { replace: () => {} } },
        { provide: ThumbnailGenerationService, useValue: { checkThumbnailCache: async () => ({}), startThumbnailGeneration: () => false } },
      ],
    });

    await TestBed.inject(OpenFolderService).open('/b');

    expect(statusWhenClosed).toMatchObject({ numberOfLoadedFiles: 2, numberOfAllFilesToLoad: 2, isCompleted: true });
  });
});
