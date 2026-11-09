import { Component, OnInit, viewChild, inject } from '@angular/core';
import { MatSort, MatSortHeader } from '@angular/material/sort';
import { DomSanitizer } from '@angular/platform-browser';
import { TableVirtualScrollDataSource, TableVirtualScrollModule } from 'ng-table-virtual-scroll';
import { Analytics } from '../../../../../src-shared/analytics/analytics';
import { openContainingFolder, openWithAssociatedApp } from '../../../shared/open-with-os';
import { createPrependedLogger } from '../../../../../src-shared/log/create-prepended-logger';
import { IconDataUrl } from '../../../../assets/icon-data-url';
import { ThumbnailGenerationService } from '../../service/thumbnail-generation.service';
import { MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';

const logger = createPrependedLogger('[Thumbnail Generation Error Table]');

interface TableRow {
  position: number;
  filePath: string;
}

@Component({
  selector: 'app-thumbnail-generation-error-table',
  templateUrl: './thumbnail-generation-error-table.component.html',
  styleUrls: ['./thumbnail-generation-error-table.component.scss'],
  imports: [
    MatFormField, MatInput, CdkVirtualScrollViewport, TableVirtualScrollModule, MatTable, MatSort, MatColumnDef,
    MatHeaderCellDef, MatHeaderCell, MatSortHeader, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef,
    MatRow,
  ]
})
export class ThumbnailGenerationErrorTableComponent implements OnInit {
  private sanitizer = inject(DomSanitizer);
  private thumbnailGenerationService = inject(ThumbnailGenerationService);

  public displayedColumns: string[] = ['position', 'filePath'];
  public dataSource = new TableVirtualScrollDataSource<TableRow>();

  public get launchExternalAppIconDataUrl() { return this.sanitizer.bypassSecurityTrustResourceUrl(IconDataUrl.launchExternalApp); }
  public get folderIconDataUrl() { return this.sanitizer.bypassSecurityTrustResourceUrl(IconDataUrl.folder); }

  private readonly sort = viewChild.required(MatSort);

  public ngOnInit() {
    const filePathsWithoutThumbnail = this.thumbnailGenerationService.status().result?.filePathsWithoutThumbnail ?? [];
    this.dataSource.data = filePathsWithoutThumbnail.map((filePath, index) => {
      return {
        position: index + 1,
        filePath: filePath
      };
    });
    this.dataSource.sort = this.sort();
  }

  public applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  public handleOpenFileButtonClicked(filePath: string) {
    openWithAssociatedApp(filePath);
    logger.info(`Opened the file with its associated app. File Path: "${filePath}"`);
    Analytics.trackEvent('Thumbnail Generation Error Table', '[ThumbGen Error Table] Open File');
  }

  public handleOpenFolderButtonClicked(filePath: string) {
    openContainingFolder(filePath);
    logger.info(`Opened the containing folder of the file. File Path: "${filePath}"`);
    Analytics.trackEvent('Thumbnail Generation Error Table', '[ThumbGen Error Table] Open Folder');
  }
}
