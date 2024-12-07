import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { TableVirtualScrollDataSource } from 'ng-table-virtual-scroll';
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
  constructor(private thumbnailGenerationService: ThumbnailGenerationService) {
  }

  displayedColumns: string[] = ['position', 'filePath'];
  dataSource = new TableVirtualScrollDataSource<TableRow>();

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  ngOnInit() {
    this.dataSource.data = this.thumbnailGenerationService.thumbnailGenerationResult.filePathsWithoutThumbnail.map((filePath, index) => {
      return {
        position: index + 1,
        filePath: filePath
      };
    });
    this.dataSource.sort = this.sort;
  }

  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}
