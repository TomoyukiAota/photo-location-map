import { TestBed } from '@angular/core/testing';
import { Analytics } from '../../../../src-shared/analytics/analytics';
import { DirectoryTreeViewSelectionService } from '../../directory-tree-view/directory-tree-view-selection.service';
import { OpenFolderService } from './open-folder.service';
import { OpenTargetService } from './open-target.service';
import { PhotoDataService } from './photo-data.service';
import { PhotoSelectionHistoryService } from './photo-selection-history.service';

describe('OpenTargetService', () => {
  /** What the stand-ins were asked to do, in order. */
  let steps: string[];
  let service: OpenTargetService;

  beforeEach(() => {
    steps = [];
    TestBed.configureTestingModule({
      providers: [
        { provide: OpenFolderService, useValue: { open: async (folderPath: string) => { steps.push(`open ${folderPath}`); } } },
        { provide: PhotoDataService, useValue: { getPhotoPathsWithGpsInfo: () => ['/photos/trip/with location.jpg'] } },
        { provide: PhotoSelectionHistoryService, useValue: { reset: () => { steps.push('reset history'); } } },
        { provide: DirectoryTreeViewSelectionService, useValue: { select: (paths: string[]) => { steps.push(`select ${JSON.stringify(paths)}`); } } },
      ],
    });
    service = TestBed.inject(OpenTargetService);
  });

  it('opens a folder, which selects all of its photos', async () => {
    await service.open({ kind: 'directory', path: '/photos/trip' }, 'Drop to Open');
    expect(steps).toEqual(['open /photos/trip']);
  });

  it('opens the folder of a file, then selects only the file, which has a location, without the history of that', async () => {
    await service.open({ kind: 'file', path: '/photos/trip/with location.jpg', parentFolderPath: '/photos/trip' }, 'Drop to Open');
    expect(steps).toEqual(['open /photos/trip', 'reset history', 'select ["/photos/trip/with location.jpg"]']);
  });

  it('selects nothing in the folder of a file without a location, which cannot be selected', async () => {
    await service.open({ kind: 'file', path: '/photos/trip/notes.txt', parentFolderPath: '/photos/trip' }, 'Open After Launch');
    expect(steps).toEqual(['open /photos/trip', 'reset history', 'select []']);
  });

  it('names its analytics events after how the path was given', async () => {
    const trackEvent = vi.spyOn(Analytics, 'trackEvent').mockImplementation(() => undefined);
    await service.open({ kind: 'directory', path: '/photos/trip' }, 'Drop to Open');
    await service.open({ kind: 'file', path: '/photos/trip/a.jpg', parentFolderPath: '/photos/trip' }, 'Open After Launch');
    expect(trackEvent.mock.calls).toEqual([
      ['Drop to Open', 'Drop to Open: Directory', 'Item Type: Directory'],
      ['Open After Launch', 'Open After Launch: File', 'Item Type: File'],
    ]);
    trackEvent.mockRestore();
  });
});
