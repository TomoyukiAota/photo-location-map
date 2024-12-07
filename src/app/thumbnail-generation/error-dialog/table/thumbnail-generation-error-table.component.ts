import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { DomSanitizer } from '@angular/platform-browser';
import { TableVirtualScrollDataSource } from 'ng-table-virtual-scroll';
import { IconDataUrl } from '../../../../assets/icon-data-url';
import { ThumbnailGenerationService } from '../../service/thumbnail-generation.service';

interface TableRow {
  position: number;
  filePath: string;
}

@Component({
  selector: 'app-thumbnail-generation-error-table',
  templateUrl: './thumbnail-generation-error-table.component.html',
  styleUrls: ['./thumbnail-generation-error-table.component.scss']
})
export class ThumbnailGenerationErrorTableComponent implements OnInit {
  public displayedColumns: string[] = ['position', 'filePath'];
  public dataSource = new TableVirtualScrollDataSource<TableRow>();

  public get launchExternalAppIconDataUrl() { return this.sanitizer.bypassSecurityTrustResourceUrl(IconDataUrl.launchExternalApp); }
  public get folderIconDataUrl() { return this.sanitizer.bypassSecurityTrustResourceUrl(IconDataUrl.folder); }

  @ViewChild(MatSort, { static: true }) private sort: MatSort;

  constructor(private sanitizer: DomSanitizer,
              private thumbnailGenerationService: ThumbnailGenerationService,
  ) {
  }

  public ngOnInit() {
    this.dataSource.data = this.thumbnailGenerationService.thumbnailGenerationResult.filePathsWithoutThumbnail.map((filePath, index) => {
      return {
        position: index + 1,
        filePath: filePath
      };
    });
    this.dataSource.sort = this.sort;
  }

  public applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  public handleOpenFileIconClicked(filePath: string) {
    console.log('handleOpenFileIconClicked', filePath);
    // TODO
  }

  public handleOpenFolderIconClicked(filePath: string) {
    console.log('handleOpenFolderIconClicked', filePath);
    // TODO
  }
}
