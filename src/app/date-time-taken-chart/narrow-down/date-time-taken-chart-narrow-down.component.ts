import { Component } from '@angular/core';
import { Analytics } from '../../../../src-shared/analytics/analytics';
import { DirectoryTreeViewSelectionService } from '../../directory-tree-view/directory-tree-view-selection.service';
import { PinnedPhotoService } from '../../shared/service/pinned-photo.service';
import { dateTimeTakenChartLogger as logger } from '../date-time-taken-chart-logger';

@Component({
  selector: 'app-date-time-taken-chart-narrow-down',
  templateUrl: './date-time-taken-chart-narrow-down.component.html',
  styleUrls: ['./date-time-taken-chart-narrow-down.component.scss']
})
export class DateTimeTakenChartNarrowDownComponent {
  constructor(private directoryTreeViewSelectionService: DirectoryTreeViewSelectionService,
              private pinnedPhotoService: PinnedPhotoService) {
  }

  public onNarrowDownClicked() {
    logger.info('Clicked "Narrow Down" button.');
    Analytics.trackEvent('DTT Chart', `[DTT Chart] Clicked "Narrow Down"`);
    const pinnedPhotos = this.pinnedPhotoService.getPinnedPhotos();
    const photoPaths = pinnedPhotos.map(photo => photo.path);
    this.directoryTreeViewSelectionService.select(photoPaths);
  }
}
