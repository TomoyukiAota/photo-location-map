import { inject, Service } from '@angular/core';
import { Subject } from 'rxjs';
import { DateTimeTakenChartConfigService } from '../../date-time-taken-chart/config/date-time-taken-chart-config.service';
import { DirectoryTreeViewSelectionService } from '../../directory-tree-view/directory-tree-view-selection.service';
import { Photo } from '../model/photo.model';
import { PinnedPhotoService } from './pinned-photo.service';
import { SelectedPhotoService } from './selected-photo.service';

/**
 * Shows a photo in the other part of the window: on the map, for its row of the folder tree ("Reveal in Map"), and in
 * the folder tree, for its popup on the map ("Reveal in Sidebar"). The map and the tree each handle their requests,
 * which are events, as the requests of the selection are: each is handled when it is made, and both exist from the
 * start, so that no request is missed.
 */
@Service()
export class PhotoRevealService {
  private readonly chartConfigService = inject(DateTimeTakenChartConfigService);
  private readonly directoryTreeViewSelectionService = inject(DirectoryTreeViewSelectionService);
  private readonly pinnedPhotoService = inject(PinnedPhotoService);
  private readonly selectedPhotoService = inject(SelectedPhotoService);

  /**
   * Requests to show a photo's marker, with its popup open, as a click on the marker does. The photo is pinned by
   * then, and the map shows it once it has rendered the pinned photos (LeafletMapComponent).
   */
  public readonly revealInMapRequested = new Subject<Photo>();

  /** Requests to show a photo's row of the folder tree, highlighted for a moment (DirectoryTreeViewComponent). */
  public readonly revealInSidebarRequested = new Subject<Photo>();

  /**
   * Shows the photo on the map, with its popup open. A photo that the map does not show is put on the map first:
   * - one that is not selected is selected too, keeping the others, as a click on its checkbox would, so that Undo
   *   in the Selection menu takes it off again;
   * - one that is selected but left out by the chart, by its zoom or by its menu's checkbox for the photos without a
   *   shooting time, is shown by resetting the chart's zoom, as its Reset Zoom button does.
   */
  public revealInMap(photo: Photo): void {
    const isPinned = this.pinnedPhotoService.pinnedPhotos().some(pinned => pinned.path === photo.path);
    if (!isPinned) {
      const isSelected = this.selectedPhotoService.selectedPhotos().some(selected => selected.path === photo.path);
      if (isSelected)
        this.chartConfigService.resetZoomFromOutside();
      else
        this.directoryTreeViewSelectionService.add(photo.path);
    }
    this.revealInMapRequested.next(photo);
  }

  /** Shows the photo's row of the folder tree, without changing the selection. */
  public revealInSidebar(photo: Photo): void {
    this.revealInSidebarRequested.next(photo);
  }
}
