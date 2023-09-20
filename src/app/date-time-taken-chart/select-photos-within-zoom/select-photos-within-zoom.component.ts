import { Component } from '@angular/core';
import { Analytics } from '../../../../src-shared/analytics/analytics';
import { DirectoryTreeViewSelectionService } from '../../directory-tree-view/directory-tree-view-selection.service';
import { PinnedPhotoService } from '../../shared/service/pinned-photo.service';
import { dateTimeTakenChartLogger as logger } from '../date-time-taken-chart-logger';

@Component({
  selector: 'app-select-photos-within-zoom',
  templateUrl: './select-photos-within-zoom.component.html',
  styleUrls: ['./select-photos-within-zoom.component.scss']
})
export class SelectPhotosWithinZoomComponent {
  constructor(private directoryTreeViewSelectionService: DirectoryTreeViewSelectionService,
              private pinnedPhotoService: PinnedPhotoService) {
  }

  public onButtonClicked() {
    logger.info('Clicked "Select Photos within Zoom" button.');
    Analytics.trackEvent('DTT Chart', `[DTT Chart] Select Photos within Zoom`);
    const pinnedPhotos = this.pinnedPhotoService.getPinnedPhotos();
    const photoPaths = pinnedPhotos.map(photo => photo.path);
    this.directoryTreeViewSelectionService.select(photoPaths);
  }
}
