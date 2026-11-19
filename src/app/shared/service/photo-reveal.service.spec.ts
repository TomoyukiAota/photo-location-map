import { TestBed } from '@angular/core/testing';
import moment from 'moment';
import { DateTimeTakenChartConfigService } from '../../date-time-taken-chart/config/date-time-taken-chart-config.service';
import { DirectoryTreeViewSelectionService } from '../../directory-tree-view/directory-tree-view-selection.service';
import { DateTimeOriginal } from '../model/date-time-original';
import { Exif } from '../model/exif.model';
import { Photo } from '../model/photo.model';
import { PhotoRevealService, SidebarRevealRequest } from './photo-reveal.service';
import { PinnedPhotoService } from './pinned-photo.service';
import { SelectedPhotoService } from './selected-photo.service';

/** A photo taken at the moment given, or with no shooting time without one. */
function photo(name: string, takenAt?: string): Photo {
  const exif = Object.assign(new Exif(), takenAt ? { dateTimeOriginal: new DateTimeOriginal(moment(takenAt)) } : {});
  return Object.assign(new Photo(), { name, path: `/photos/${name}`, filenameExtension: '.jpg', exif });
}

const names = (photos: readonly Photo[]) => photos.map(each => each.name);

describe('PhotoRevealService', () => {
  let service: PhotoRevealService;
  let selectedPhotoService: SelectedPhotoService;
  let pinnedPhotoService: PinnedPhotoService;
  let chartConfigService: DateTimeTakenChartConfigService;
  let selectionService: DirectoryTreeViewSelectionService;
  let revealedInMap: Photo[];
  let additions: string[];
  let zoomResets: number;

  const in2013 = photo('2013.jpg', '2013-12-18T15:43:34');
  const in2019 = photo('2019.jpg', '2019-03-16T17:29:58');
  const unknown = photo('unknown.jpg');

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PhotoRevealService);
    selectedPhotoService = TestBed.inject(SelectedPhotoService);
    pinnedPhotoService = TestBed.inject(PinnedPhotoService);
    chartConfigService = TestBed.inject(DateTimeTakenChartConfigService);
    selectionService = TestBed.inject(DirectoryTreeViewSelectionService);
    revealedInMap = [];
    additions = [];
    zoomResets = 0;
    service.revealInMapRequested.subscribe(each => revealedInMap.push(each));
    selectionService.additionRequested.subscribe(path => additions.push(path));
    chartConfigService.zoomResetFromOutside.subscribe(() => zoomResets++);
  });

  it('asks the map to reveal a photo that it shows, and changes nothing else', () => {
    selectedPhotoService.setSelectedPhotos([in2013, in2019]);

    service.revealInMap(in2019);

    expect(revealedInMap).toEqual([in2019]);
    expect(additions).toEqual([]);
    expect(zoomResets).toBe(0);
    expect(names(selectedPhotoService.selectedPhotos())).toEqual(['2013.jpg', '2019.jpg']);
  });

  it('selects a photo that is not selected too, before it asks the map to reveal it', () => {
    selectedPhotoService.setSelectedPhotos([in2013]);
    // The tree selects it, as a click on its checkbox does.
    selectionService.additionRequested.subscribe(path => selectedPhotoService.setSelectedPhotos(
      [...selectedPhotoService.getSelectedPhotos(), [in2013, in2019].find(each => each.path === path)]));

    service.revealInMap(in2019);

    expect(additions).toEqual(['/photos/2019.jpg']);
    expect(zoomResets).toBe(0);
    expect(revealedInMap).toEqual([in2019]);
    expect(names(pinnedPhotoService.pinnedPhotos())).toEqual(['2013.jpg', '2019.jpg']);
  });

  it('resets the chart\'s zoom for a selected photo that the zoom leaves out, so that the map shows it', () => {
    selectedPhotoService.setSelectedPhotos([in2013, unknown, in2019]);
    chartConfigService.setXAxisUnit('year');
    chartConfigService.zoom(['2019']);
    expect(names(pinnedPhotoService.pinnedPhotos())).toEqual(['2019.jpg']);

    service.revealInMap(in2013);

    expect(zoomResets).toBe(1);
    expect(additions).toEqual([]);
    // Pinned by the time the map hears the request, with the photos without a shooting time.
    expect(names(pinnedPhotoService.pinnedPhotos())).toEqual(['2013.jpg', 'unknown.jpg', '2019.jpg']);
    expect(revealedInMap).toEqual([in2013]);
  });

  it('shows the photos without a shooting time again for one of them that the chart\'s checkbox leaves out', () => {
    selectedPhotoService.setSelectedPhotos([in2013, unknown]);
    chartConfigService.setShowDateUnknownPhotos(false);

    service.revealInMap(unknown);

    expect(zoomResets).toBe(1);
    expect(chartConfigService.showDateUnknownPhotos()).toBe(true);
    expect(names(pinnedPhotoService.pinnedPhotos())).toEqual(['2013.jpg', 'unknown.jpg']);
  });

  it('asks the tree to reveal a photo, without changing the selection: in the middle of the sidebar, or where the sidebar shows it after a step', () => {
    const revealedInSidebar: SidebarRevealRequest[] = [];
    service.revealInSidebarRequested.subscribe(each => revealedInSidebar.push(each));
    selectedPhotoService.setSelectedPhotos([in2013]);

    service.revealInSidebar(in2013);
    service.showSteppedToInSidebar(in2013.path);

    expect(revealedInSidebar).toEqual([
      { photoPath: in2013.path, toMiddleEvenWhenShown: true },
      { photoPath: in2013.path, toMiddleEvenWhenShown: false },
    ]);
    expect(names(selectedPhotoService.selectedPhotos())).toEqual(['2013.jpg']);
  });
});
