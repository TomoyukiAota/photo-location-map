import { Component } from '@angular/core';
import { DirectoryTreeViewSelectionService } from '../../directory-tree-view/directory-tree-view-selection.service';
import { PinnedPhotoService } from '../../shared/service/pinned-photo.service';

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
    const pinnedPhotos = this.pinnedPhotoService.getPinnedPhotos();
    const photoPaths = pinnedPhotos.map(photo => photo.path);
    this.directoryTreeViewSelectionService.select(photoPaths);
  }
}
